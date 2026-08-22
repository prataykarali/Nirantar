"""
PRAYOG in-process engine.

Generates virtual citizens, walks realistic journeys, injects lab chaos,
and asks: does DHARA still protect the critical citizen booking path?

GAN/VAE traffic synthesis is intentionally omitted. A deterministic persona
mix produces the six required scenarios with reproducible counts.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from typing import Dict, List, Optional

from contracts.orchestration import OrchestrationDecision, ResilienceState
from contracts.simulation import (
    ChaosFailureMode,
    CitizenOutcome,
    CriticalJourneyVerdict,
    PersonaKind,
    PrayogRunSummary,
    TrafficScenarioKind,
)
from m0_digital_twin.railway_api import DigitalTwinRouter
from orchestrator.decision_engine.engine import DharaEngine
from orchestrator.resilience.load_shed import PROTECTED
from orchestrator.scheduling.priority_queue import AdmissionQueue
from security.gateway import KavachGateway
from simulation.chaos.injector import ChaosInjector
from simulation.personas.catalog import DEFAULT_MIX_10K, legit_plus_suspicious, scaled_mix
from simulation.personas.factory import build_population
from simulation.scenarios.catalog import get_scenario
from simulation.walker import JourneyWalker, overload_probability

PROTECTED_LIST = sorted(PROTECTED)


class PrayogEngine:
    """Headless 1K → 5K → 10K simulator. Hits the same mock the citizen hits."""

    def __init__(self, router: Optional[DigitalTwinRouter] = None) -> None:
        self.router = router or DigitalTwinRouter()
        self.kavach = KavachGateway()
        self.dhara = DharaEngine()
        self.dhara.graph = self.router.graph
        self.chaos = ChaosInjector(self.router)
        self.walker = JourneyWalker(self.router, self.kavach, self.dhara)
        self.last_run: Optional[PrayogRunSummary] = None

    def run(
        self,
        scenario: str | TrafficScenarioKind = "NORMAL",
        population: Optional[int] = None,
        persist_bookings: bool = False,
        sleep: bool = False,
        seed: int = 42,
    ) -> PrayogRunSummary:
        cfg = get_scenario(scenario)
        users = population if population is not None else cfg.workload.concurrent_virtual_users
        mix = self._mix_for(cfg.kind, users)
        self._reset_session_state()
        self.chaos.apply(cfg.chaos, sleep=sleep)
        db_slow = cfg.chaos.failure_mode in {
            ChaosFailureMode.DATABASE_SLOWDOWN,
            ChaosFailureMode.DATABASE_LOCK,
        }
        outage = cfg.chaos.failure_mode == ChaosFailureMode.SERVICE_UNRESPONSIVE
        cpu = cfg.chaos.failure_mode == ChaosFailureMode.CPU_SATURATION
        if db_slow or outage:
            self.dhara.mark_inventory_stress(True)
        else:
            self.dhara.mark_inventory_stress(False)

        overload = overload_probability(users, db_slow=db_slow, outage=outage, cpu=cpu)
        citizens = build_population(users, mix=mix, ramp_up_s=cfg.workload.ramp_up_seconds, seed=seed)
        outcomes = [
            self.walker.walk(c, overload, persist_bookings=persist_bookings)[0]
            for c in citizens
        ]
        last_decision = self.dhara.decide(
            overload_probability=overload,
            suspicious_sessions=mix.get(PersonaKind.SUSPICIOUS, 0),
            endpoint="BOOK",
            session_id="SES-prayog-aggregate",
        )
        verdict = self._verdict(outcomes, last_decision, db_slow or outage)
        summary = PrayogRunSummary(
            scenario=cfg.kind,
            target_virtual_users=cfg.workload.concurrent_virtual_users,
            simulated_users=len(citizens),
            persona_counts={k.value: v for k, v in mix.items()},
            outcomes=dict(Counter(o.outcome for o in outcomes)),
            overload_probability=overload,
            chaos=cfg.chaos,
            verdict=verdict,
            sample_citizens=citizens[:5],
        )
        self.last_run = summary
        return summary

    def run_spike(
        self,
        population_cap: Optional[int] = None,
        persist_bookings: bool = False,
        seed: int = 42,
    ) -> PrayogRunSummary:
        """Scenario D: 500 → 2,000 → 5,000 → 10,000."""
        cfg = get_scenario(TrafficScenarioKind.SUDDEN_SPIKE)
        last: Optional[PrayogRunSummary] = None
        for stage in cfg.spike_stages:
            n = int(stage["users"])
            if population_cap is not None:
                n = max(1, min(n, population_cap))
            last = self.run(
                TrafficScenarioKind.SUDDEN_SPIKE,
                population=n,
                persist_bookings=persist_bookings,
                seed=seed,
            )
        assert last is not None
        last.scenario = TrafficScenarioKind.SUDDEN_SPIKE
        last.target_virtual_users = 10000
        return last

    def _reset_session_state(self) -> None:
        """Each wave is a new population — do not carry Kavach/queue memory across stages."""
        self.kavach = KavachGateway()
        self.dhara.queue = AdmissionQueue()
        self.walker = JourneyWalker(self.router, self.kavach, self.dhara)

    def _mix_for(self, kind: TrafficScenarioKind, users: int) -> Dict[PersonaKind, int]:
        if kind == TrafficScenarioKind.BOT_SURGE:
            return legit_plus_suspicious(users, suspicious=max(1, int(users * 0.2)))
        return scaled_mix(users, DEFAULT_MIX_10K)

    def _verdict(
        self,
        outcomes: List[CitizenOutcome],
        decision: OrchestrationDecision,
        chaos_infra: bool,
    ) -> CriticalJourneyVerdict:
        legit = [o for o in outcomes if o.persona != PersonaKind.SUSPICIOUS]
        suspicious = [o for o in outcomes if o.persona == PersonaKind.SUSPICIOUS]
        booking_legit = [
            o for o in legit if o.persona not in {PersonaKind.ABANDONED, PersonaKind.SEARCH_HEAVY}
        ]
        completed = sum(1 for o in booking_legit if o.outcome in {"completed", "queued"})
        queued = sum(1 for o in booking_legit if o.outcome == "queued")
        dropped = sum(1 for o in booking_legit if o.outcome in {"dropped", "failed_chaos"})
        throttled = sum(1 for o in suspicious if o.throttled or o.outcome == "throttled")
        denom = max(len(booking_legit), 1)
        success = completed / denom
        shed = decision.load_shed.disabled_features
        critical_shed = [s for s in shed if s in PROTECTED or s in {"BookingEngine", "AuthService"}]
        protected_ok = len(critical_shed) == 0
        drop_ok = (dropped / denom) < 0.15
        db_ok = (not chaos_infra) or decision.database_protection_enabled
        queue_ok = (not chaos_infra) or decision.current_state in {
            ResilienceState.QUEUE_ACTIVATED,
            ResilienceState.LOAD_SHEDDING,
            ResilienceState.EMERGENCY_DEGRADED,
        }
        maintained = protected_ok and drop_ok and db_ok and queue_ok and success >= 0.85
        reason = self._reason(maintained, protected_ok, drop_ok, db_ok, decision)
        return CriticalJourneyVerdict(
            maintained=maintained,
            dhara_state=decision.current_state.value,
            booking_success_rate=round(success, 4),
            legit_completed=completed,
            legit_queued=queued,
            legit_dropped=dropped,
            suspicious_throttled=throttled,
            suspicious_total=len(suspicious),
            protected_services=PROTECTED_LIST,
            shed_features=shed,
            database_protection_enabled=decision.database_protection_enabled,
            reason=reason,
        )

    def _reason(
        self,
        maintained: bool,
        protected_ok: bool,
        drop_ok: bool,
        db_ok: bool,
        decision: OrchestrationDecision,
    ) -> str:
        if maintained:
            return (
                f"DHARA {decision.current_state.value}: critical booking path held; "
                f"non-critical shed={decision.load_shed.disabled_features}"
            )
        parts = []
        if not protected_ok:
            parts.append("critical service was shed")
        if not drop_ok:
            parts.append("too many legitimate bookings dropped")
        if not db_ok:
            parts.append("inventory DB was not protected")
        return "; ".join(parts) or "critical journey degraded"


def main() -> None:
    scenario = sys.argv[1] if len(sys.argv) > 1 else "NORMAL"
    population = int(sys.argv[2]) if len(sys.argv) > 2 else None
    engine = PrayogEngine()
    if str(scenario).upper() in {"D", "SUDDEN_SPIKE"}:
        summary = engine.run_spike(population_cap=population)
    else:
        summary = engine.run(scenario, population=population)
    sys.stdout.write(json.dumps(summary.model_dump(), indent=2) + "\n")


if __name__ == "__main__":
    main()
