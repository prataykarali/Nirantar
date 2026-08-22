"""Named PRAYOG traffic scenarios (A–F)."""

from __future__ import annotations

from typing import Dict

from contracts.simulation import (
    ChaosFailureMode,
    ChaosInjectionConfig,
    SimulationScenarioConfig,
    TrafficScenarioKind,
    WorkloadProfile,
    WorkloadType,
)
from simulation.personas.catalog import DEFAULT_MIX_10K, legit_plus_suspicious, scaled_mix


def _mix_as_str(total: int, kind: TrafficScenarioKind) -> Dict[str, int]:
    if kind == TrafficScenarioKind.BOT_SURGE:
        mix = legit_plus_suspicious(total, suspicious=max(1, int(total * 0.2)))
    else:
        mix = scaled_mix(total, DEFAULT_MIX_10K)
    return {k.value: v for k, v in mix.items()}


def _cfg(
    kind: TrafficScenarioKind,
    name: str,
    description: str,
    users: int,
    workload_type: WorkloadType,
    chaos: ChaosInjectionConfig | None = None,
    spike: bool = False,
    duration: int = 60,
) -> SimulationScenarioConfig:
    stages = []
    if spike:
        stages = [
            {"users": 500, "duration_s": 20, "spawn_rate": 50},
            {"users": 2000, "duration_s": 20, "spawn_rate": 100},
            {"users": 5000, "duration_s": 20, "spawn_rate": 150},
            {"users": 10000, "duration_s": 40, "spawn_rate": 200},
        ]
    return SimulationScenarioConfig(
        name=name,
        description=description,
        kind=kind,
        workload=WorkloadProfile(
            workload_type=workload_type,
            concurrent_virtual_users=users,
            target_rps=max(20.0, users / 8.0),
            duration_seconds=duration,
            ramp_up_seconds=10 if users <= 1000 else 20,
        ),
        chaos=chaos or ChaosInjectionConfig(),
        persona_mix=_mix_as_str(users, kind),
        spike_stages=stages,
        expected_resilience_score=0.85,
    )


SCENARIOS: Dict[TrafficScenarioKind, SimulationScenarioConfig] = {
    TrafficScenarioKind.NORMAL: _cfg(
        TrafficScenarioKind.NORMAL,
        "Scenario A — Normal",
        "1,000 concurrent virtual citizens on a quiet daytime load.",
        1000,
        WorkloadType.NORMAL_DAYTIME,
    ),
    TrafficScenarioKind.PEAK: _cfg(
        TrafficScenarioKind.PEAK,
        "Scenario B — Peak",
        "5,000 concurrent virtual citizens around a busy booking window.",
        5000,
        WorkloadType.TATKAL_PEAK,
        duration=90,
    ),
    TrafficScenarioKind.EXTREME: _cfg(
        TrafficScenarioKind.EXTREME,
        "Scenario C — Extreme",
        "10,000 concurrent virtual citizens. Prove the loop, not 10,000 browsers.",
        10000,
        WorkloadType.TATKAL_PEAK,
        duration=120,
    ),
    TrafficScenarioKind.SUDDEN_SPIKE: _cfg(
        TrafficScenarioKind.SUDDEN_SPIKE,
        "Scenario D — Sudden spike",
        "500 → 2,000 → 5,000 → 10,000 virtual users.",
        10000,
        WorkloadType.TATKAL_PEAK,
        spike=True,
        duration=100,
    ),
    TrafficScenarioKind.BOT_SURGE: _cfg(
        TrafficScenarioKind.BOT_SURGE,
        "Scenario E — Bot surge",
        "8,000 legitimate citizens + 2,000 suspicious sessions.",
        10000,
        WorkloadType.BOT_SURGE,
        duration=90,
    ),
    TrafficScenarioKind.INFRA_DEGRADATION: _cfg(
        TrafficScenarioKind.INFRA_DEGRADATION,
        "Scenario F — Infrastructure degradation",
        "10,000 users plus SeatInventoryDB latency ×5.",
        10000,
        WorkloadType.CHAOS_FAILURE,
        chaos=ChaosInjectionConfig(
            target_service="SeatInventoryDB",
            failure_mode=ChaosFailureMode.DATABASE_SLOWDOWN,
            injected_latency_ms=100.0,
            forced_error_rate=0.0,
        ),
        duration=90,
    ),
}


def get_scenario(name: str | TrafficScenarioKind) -> SimulationScenarioConfig:
    """Look up a scenario by enum or case-insensitive name."""
    if isinstance(name, TrafficScenarioKind):
        return SCENARIOS[name]
    key = name.strip().upper().replace(" ", "_").replace("-", "_")
    aliases = {
        "A": "NORMAL",
        "B": "PEAK",
        "C": "EXTREME",
        "D": "SUDDEN_SPIKE",
        "E": "BOT_SURGE",
        "F": "INFRA_DEGRADATION",
        "SCENARIO_A": "NORMAL",
        "SCENARIO_B": "PEAK",
        "SCENARIO_C": "EXTREME",
        "SCENARIO_D": "SUDDEN_SPIKE",
        "SCENARIO_E": "BOT_SURGE",
        "SCENARIO_F": "INFRA_DEGRADATION",
    }
    kind = TrafficScenarioKind(aliases.get(key, key))
    return SCENARIOS[kind]
