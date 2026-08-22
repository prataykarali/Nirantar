"""
NIRANTAR PRAYOG Simulation Engine & Load Balancing Gateway Services.

Provides:
- PrayogEngine managing 10,000 Virtual Citizen Personas (35% Rural, 30% Tatkal Rush, 20% Commuter, 15% Bot/Scalper)
- DynamicAdmissionTokenBucket (Admission rate limiting & burst token management)
- EdgeCDNCacheHeaderManager (Cache-Control, s-maxage, stale-while-revalidate headers)
- Dhara Surge Shedding for 10:00 AM Tatkal rush
"""

from __future__ import annotations

import time
from collections import Counter
from typing import Any, Dict, List, Optional

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
from m6_prayog.chaos_suite import chaos_suite
from m6_prayog.metrics import telemetry_tracker
from orchestrator.decision_engine.engine import DharaEngine
from orchestrator.resilience.load_shed import PROTECTED
from orchestrator.scheduling.priority_queue import AdmissionQueue
from security.gateway import KavachGateway
from simulation.chaos.injector import ChaosInjector
from simulation.personas.catalog import (
    DEFAULT_MIX_10K,
    DEMOGRAPHIC_MIX_10K,
    legit_plus_suspicious,
    scaled_mix,
)
from simulation.personas.factory import build_population
from simulation.scenarios.catalog import get_scenario
from simulation.walker import JourneyWalker, overload_probability

PROTECTED_LIST = sorted(PROTECTED)


class DynamicAdmissionTokenBucket:
    """Dynamic admission token bucket for rate-limiting and burst traffic management."""

    def __init__(self, base_capacity: int = 1000, base_refill_rate: float = 200.0) -> None:
        self.base_capacity = base_capacity
        self.base_refill_rate = base_refill_rate
        self.capacity = base_capacity
        self.refill_rate = base_refill_rate
        self.tokens = float(base_capacity)
        self.last_update = time.time()
        self.total_admitted = 0
        self.total_rejected = 0

    def adjust_for_load(self, overload_prob: float, is_tatkal_surge: bool = False) -> None:
        """Dynamically scale capacity and refill rate based on overload signal & Tatkal rush."""
        if is_tatkal_surge or overload_prob >= 0.8:
            self.capacity = int(self.base_capacity * 0.4)
            self.refill_rate = self.base_refill_rate * 0.5
        elif overload_prob >= 0.5:
            self.capacity = int(self.base_capacity * 0.7)
            self.refill_rate = self.base_refill_rate * 0.8
        else:
            self.capacity = self.base_capacity
            self.refill_rate = self.base_refill_rate
        self.tokens = min(self.tokens, float(self.capacity))

    def consume(self, count: int = 1) -> bool:
        now = time.time()
        elapsed = max(0.0, now - self.last_update)
        self.last_update = now
        self.tokens = min(float(self.capacity), self.tokens + (elapsed * self.refill_rate))
        if self.tokens >= count:
            self.tokens -= count
            self.total_admitted += count
            return True
        self.total_rejected += count
        return False

    def reset(self) -> None:
        self.capacity = self.base_capacity
        self.refill_rate = self.base_refill_rate
        self.tokens = float(self.base_capacity)
        self.last_update = time.time()
        self.total_admitted = 0
        self.total_rejected = 0

    def get_status(self) -> Dict[str, Any]:
        return {
            "capacity": self.capacity,
            "tokens_available": round(self.tokens, 2),
            "refill_rate_per_sec": self.refill_rate,
            "total_admitted": self.total_admitted,
            "total_rejected": self.total_rejected,
        }


class EdgeCDNCacheHeaderManager:
    """Manager for Edge CDN Caching Headers."""

    @staticmethod
    def get_headers(endpoint_type: str = "search") -> Dict[str, str]:
        endpoint = endpoint_type.lower()
        if "station" in endpoint or "static" in endpoint:
            return {
                "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=600",
                "Edge-Cache-Policy": "STATIC_IMMUTABLE",
            }
        elif "search" in endpoint or "schedule" in endpoint:
            return {
                "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=120",
                "Edge-Cache-Policy": "READ_HEAVY_CACHED",
            }
        elif "availability" in endpoint:
            return {
                "Cache-Control": "public, max-age=5, s-maxage=10, stale-while-revalidate=15",
                "Edge-Cache-Policy": "HIGH_VOLATILITY_SHORT_TTL",
            }
        else:
            return {
                "Cache-Control": "private, no-store, no-cache, must-revalidate",
                "Edge-Cache-Policy": "ZERO_CACHE_TRANSACTIONAL",
            }

    @staticmethod
    def list_rules() -> List[Dict[str, Any]]:
        return [
            {
                "pattern": "/api/v1/stations",
                "cache_control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=600",
                "policy": "STATIC_IMMUTABLE",
            },
            {
                "pattern": "/api/v1/trains/search",
                "cache_control": "public, max-age=60, s-maxage=300, stale-while-revalidate=120",
                "policy": "READ_HEAVY_CACHED",
            },
            {
                "pattern": "/api/v1/availability",
                "cache_control": "public, max-age=5, s-maxage=10, stale-while-revalidate=15",
                "policy": "HIGH_VOLATILITY_SHORT_TTL",
            },
            {
                "pattern": "/api/v1/booking/*",
                "cache_control": "private, no-store, no-cache, must-revalidate",
                "policy": "ZERO_CACHE_TRANSACTIONAL",
            },
        ]


class PrayogEngine:
    """PRAYOG Engine — 10,000 synthetic citizen simulation & resilience engine."""

    def __init__(self, router: Optional[DigitalTwinRouter] = None) -> None:
        self.router = router or DigitalTwinRouter()
        self.kavach = KavachGateway()
        self.dhara = DharaEngine()
        self.dhara.graph = self.router.graph
        self.chaos = ChaosInjector(self.router)
        self.walker = JourneyWalker(self.router, self.kavach, self.dhara)
        self.token_bucket = DynamicAdmissionTokenBucket()
        self.cdn_cache = EdgeCDNCacheHeaderManager()
        self.tatkal_surge_active: bool = False
        self.last_run: Optional[PrayogRunSummary] = None

    def trigger_tatkal_surge(self, active: bool = True) -> Dict[str, Any]:
        """Activate or deactivate 10:00 AM Tatkal Surge Shedding."""
        self.tatkal_surge_active = active
        self.dhara.mark_inventory_stress(active)
        self.token_bucket.adjust_for_load(0.85 if active else 0.1, is_tatkal_surge=active)
        return {
            "tatkal_surge_active": active,
            "dhara_load_shedding": active,
            "protected_services": PROTECTED_LIST,
            "shed_features": ["SearchService_uncached", "NotificationDispatcher", "recommendations", "analytics"]
            if active
            else [],
            "token_bucket": self.token_bucket.get_status(),
        }

    def run(
        self,
        scenario: str | TrafficScenarioKind = "NORMAL",
        population: Optional[int] = None,
        persist_bookings: bool = False,
        sleep: bool = False,
        seed: int = 42,
        use_demographic_mix: bool = False,
    ) -> PrayogRunSummary:
        cfg = get_scenario(scenario)
        users = population if population is not None else cfg.workload.concurrent_virtual_users
        mix = self._mix_for(cfg.kind, users, use_demographic_mix=use_demographic_mix)
        self._reset_session_state()

        # Apply lab chaos injection
        self.chaos.apply(cfg.chaos, sleep=sleep)
        db_slow = cfg.chaos.failure_mode in {
            ChaosFailureMode.DATABASE_SLOWDOWN,
            ChaosFailureMode.DATABASE_LOCK,
        }
        outage = cfg.chaos.failure_mode == ChaosFailureMode.SERVICE_UNRESPONSIVE
        cpu = cfg.chaos.failure_mode == ChaosFailureMode.CPU_SATURATION
        is_tatkal = cfg.kind in {TrafficScenarioKind.PEAK, TrafficScenarioKind.EXTREME} or self.tatkal_surge_active

        if db_slow or outage or is_tatkal:
            self.dhara.mark_inventory_stress(True)
        else:
            self.dhara.mark_inventory_stress(False)

        overload = overload_probability(users, db_slow=db_slow, outage=outage, cpu=cpu)
        self.token_bucket.adjust_for_load(overload, is_tatkal_surge=is_tatkal)

        citizens = build_population(users, mix=mix, ramp_up_s=cfg.workload.ramp_up_seconds, seed=seed)
        outcomes: List[CitizenOutcome] = []
        for c in citizens:
            # Check token bucket admission
            admitted = self.token_bucket.consume(1)
            if not admitted and c.persona in {PersonaKind.SUSPICIOUS, PersonaKind.BOT_SCALPER}:
                outcomes.append(CitizenOutcome(user_id=c.user_id, persona=c.persona, outcome="throttled", throttled=True))
            else:
                outcomes.append(self.walker.walk(c, overload, persist_bookings=persist_bookings)[0])

        last_decision = self.dhara.decide(
            overload_probability=overload,
            suspicious_sessions=mix.get(PersonaKind.SUSPICIOUS, 0) + mix.get(PersonaKind.BOT_SCALPER, 0),
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

        # Update telemetry metrics tracker
        telemetry_tracker.update_from_run(
            simulated_users=len(citizens),
            queue_depth=verdict.legit_queued,
            outcomes=summary.outcomes,
            duration_s=float(cfg.workload.duration_seconds),
            overload_prob=overload,
            db_slow=db_slow,
        )

        self.last_run = summary
        return summary

    def run_spike(
        self,
        population_cap: Optional[int] = None,
        persist_bookings: bool = False,
        seed: int = 42,
    ) -> PrayogRunSummary:
        """Scenario D: 500 → 2,000 → 5,000 → 10,000 VUs."""
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

    def stop(self) -> Dict[str, Any]:
        """Halt running simulation and reset state."""
        self._reset_session_state()
        self.token_bucket.reset()
        self.tatkal_surge_active = False
        self.dhara.mark_inventory_stress(False)
        telemetry_tracker.reset()
        return {"status": "stopped", "message": "Simulation halted and state reset successfully."}

    def get_load_balance_status(self) -> Dict[str, Any]:
        """Return load balancing status: token bucket, CDN rules, Tatkal surge status."""
        return {
            "token_bucket": self.token_bucket.get_status(),
            "cdn_cache_rules": self.cdn_cache.list_rules(),
            "tatkal_surge_shedding": {
                "active": self.tatkal_surge_active,
                "protected_services": PROTECTED_LIST,
                "shed_features": ["SearchService_uncached", "NotificationDispatcher", "recommendations", "analytics"]
                if self.tatkal_surge_active
                else [],
            },
            "sample_cdn_headers": {
                "stations": self.cdn_cache.get_headers("stations"),
                "search": self.cdn_cache.get_headers("search"),
                "availability": self.cdn_cache.get_headers("availability"),
                "booking": self.cdn_cache.get_headers("booking"),
            },
        }

    def _reset_session_state(self) -> None:
        self.kavach = KavachGateway()
        self.dhara.queue = AdmissionQueue()
        self.walker = JourneyWalker(self.router, self.kavach, self.dhara)

    def _mix_for(
        self,
        kind: TrafficScenarioKind,
        users: int,
        use_demographic_mix: bool = False,
    ) -> Dict[PersonaKind, int]:
        if kind == TrafficScenarioKind.BOT_SURGE:
            return legit_plus_suspicious(users, suspicious=max(1, int(users * 0.2)))
        if use_demographic_mix:
            return scaled_mix(users, DEMOGRAPHIC_MIX_10K)
        return scaled_mix(users, DEFAULT_MIX_10K)

    def _verdict(
        self,
        outcomes: List[CitizenOutcome],
        decision: OrchestrationDecision,
        chaos_infra: bool,
    ) -> CriticalJourneyVerdict:
        legit = [o for o in outcomes if o.persona not in {PersonaKind.SUSPICIOUS, PersonaKind.BOT_SCALPER}]
        suspicious = [o for o in outcomes if o.persona in {PersonaKind.SUSPICIOUS, PersonaKind.BOT_SCALPER}]
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


__all__ = [
    "PrayogEngine",
    "DynamicAdmissionTokenBucket",
    "EdgeCDNCacheHeaderManager",
]
