"""
PRAYOG Stress Scenarios & Lab Chaos Suite (Scenarios A through F).

Scenario A — Normal: 1,000 VUs, quiet daytime traffic.
Scenario B — Peak: 5,000 VUs, Tatkal rush window.
Scenario C — Extreme: 10,000 VUs Tatkal peak.
Scenario D — Sudden Spike: 500 → 2,000 → 5,000 → 10,000 VUs.
Scenario E — Bot Surge: 8,000 legitimate VUs + 2,000 suspicious/bot VUs.
Scenario F — Infra Degradation: 10,000 VUs + SeatInventoryDB latency x5.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from contracts.simulation import (
    ChaosFailureMode,
    ChaosInjectionConfig,
    PrayogRunSummary,
    SimulationScenarioConfig,
    TrafficScenarioKind,
)
from m6_prayog.metrics import telemetry_tracker
from simulation.scenarios.catalog import SCENARIOS, get_scenario


class ChaosSuite:
    """Manager for PRAYOG 6 Stress Scenarios (A through F) & Chaos Injection."""

    def __init__(self, engine: Any = None) -> None:
        self._engine = engine

    def set_engine(self, engine: Any) -> None:
        self._engine = engine

    def list_scenarios(self) -> List[Dict[str, Any]]:
        """Return definitions of all 6 stress scenarios."""
        result = []
        for kind, cfg in SCENARIOS.items():
            scenario_letter = {
                TrafficScenarioKind.NORMAL: "A",
                TrafficScenarioKind.PEAK: "B",
                TrafficScenarioKind.EXTREME: "C",
                TrafficScenarioKind.SUDDEN_SPIKE: "D",
                TrafficScenarioKind.BOT_SURGE: "E",
                TrafficScenarioKind.INFRA_DEGRADATION: "F",
            }.get(kind, "")
            result.append(
                {
                    "id": scenario_letter,
                    "kind": kind.value,
                    "name": cfg.name,
                    "description": cfg.description,
                    "concurrent_virtual_users": cfg.workload.concurrent_virtual_users,
                    "target_rps": cfg.workload.target_rps,
                    "duration_seconds": cfg.workload.duration_seconds,
                    "chaos": cfg.chaos.model_dump(),
                    "spike_stages": cfg.spike_stages,
                }
            )
        return result

    def run_scenario(
        self,
        scenario_key: str,
        population: Optional[int] = None,
        persist_bookings: bool = False,
        seed: int = 42,
        engine: Any = None,
    ) -> PrayogRunSummary:
        eng = engine or self._engine
        if eng is None:
            try:
                from backend.app.core.runtime import prayog as runtime_prayog
                eng = runtime_prayog
            except ImportError:
                from backend.app.services.simulation.prayog import PrayogEngine
                eng = PrayogEngine()

        cfg = get_scenario(scenario_key)

        if cfg.kind == TrafficScenarioKind.SUDDEN_SPIKE or str(scenario_key).upper() in {"D", "SUDDEN_SPIKE"}:
            summary = eng.run_spike(population_cap=population, persist_bookings=persist_bookings, seed=seed)
        else:
            summary = eng.run(
                cfg.kind,
                population=population,
                persist_bookings=persist_bookings,
                seed=seed,
            )

        # Update metrics tracker
        db_slow = cfg.chaos.failure_mode in {
            ChaosFailureMode.DATABASE_SLOWDOWN,
            ChaosFailureMode.DATABASE_LOCK,
        }
        telemetry_tracker.update_from_run(
            simulated_users=summary.simulated_users,
            queue_depth=summary.verdict.legit_queued,
            outcomes=summary.outcomes,
            duration_s=float(cfg.workload.duration_seconds),
            overload_prob=summary.overload_probability,
            db_slow=db_slow,
        )

        return summary


chaos_suite = ChaosSuite()
