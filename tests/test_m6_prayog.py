"""PRAYOG — virtual citizens, personas, scenarios, chaos, DHARA verdict."""

from __future__ import annotations

from collections import Counter

from fastapi.testclient import TestClient

from contracts.simulation import (
    ChaosFailureMode,
    DeviceType,
    JourneyStep,
    PersonaKind,
    TrafficScenarioKind,
    VirtualCitizen,
)
from m0_digital_twin.railway_api import DigitalTwinRouter
from simulation.chaos.injector import ChaosInjector
from simulation.engine import PrayogEngine
from simulation.personas.catalog import DEFAULT_MIX_10K, scaled_mix
from simulation.personas.factory import build_population
from simulation.scenarios.catalog import SCENARIOS, get_scenario
from simulation.walker import overload_probability

from backend.app.main import app


def test_virtual_citizen_fields() -> None:
    citizens = build_population(20, seed=1)
    citizen = citizens[0]
    assert isinstance(citizen, VirtualCitizen)
    assert citizen.user_id.startswith("VU-")
    assert citizen.intent
    assert citizen.language in {"hi", "en", "bn", "ta"}
    assert citizen.device in DeviceType
    assert citizen.arrival_time_s >= 0.0
    assert citizen.think_time_s > 0.0
    assert citizen.session_duration_s > 0.0
    assert len(citizen.journey) >= 1
    assert citizen.persona in PersonaKind


def test_persona_mix_sums_to_10000() -> None:
    assert sum(DEFAULT_MIX_10K.values()) == 10000
    assert DEFAULT_MIX_10K[PersonaKind.NORMAL] == 5500
    assert DEFAULT_MIX_10K[PersonaKind.SEARCH_HEAVY] == 1500
    assert DEFAULT_MIX_10K[PersonaKind.RETURNING] == 1000
    assert DEFAULT_MIX_10K[PersonaKind.SLOW_MOBILE] == 800
    assert DEFAULT_MIX_10K[PersonaKind.RETRY_HEAVY] == 500
    assert DEFAULT_MIX_10K[PersonaKind.SUSPICIOUS] == 500
    assert DEFAULT_MIX_10K[PersonaKind.ABANDONED] == 200


def test_scaled_mix_preserves_total() -> None:
    mix = scaled_mix(80)
    assert sum(mix.values()) == 80
    assert set(mix) == set(DEFAULT_MIX_10K)


def test_factory_matches_scaled_mix() -> None:
    pop = build_population(200, seed=7)
    counts = Counter(c.persona for c in pop)
    assert sum(counts.values()) == 200
    expected = scaled_mix(200)
    for kind, n in expected.items():
        assert counts[kind] == n


def test_booking_journey_is_not_root_hammer() -> None:
    steps = build_population(30, seed=3)
    booking = next(c for c in steps if c.persona == PersonaKind.NORMAL)
    assert booking.journey[0] == JourneyStep.OPEN
    assert JourneyStep.SEARCH in booking.journey
    assert JourneyStep.SELECT in booking.journey
    assert JourneyStep.BOOK in booking.journey
    assert JourneyStep.PAYMENT in booking.journey
    assert JourneyStep.CONFIRMATION in booking.journey
    assert JourneyStep.THINK in booking.journey


def test_scenarios_a_through_f() -> None:
    assert get_scenario("A").workload.concurrent_virtual_users == 1000
    assert get_scenario("B").workload.concurrent_virtual_users == 5000
    assert get_scenario("C").workload.concurrent_virtual_users == 10000
    spike = get_scenario("D")
    assert [s["users"] for s in spike.spike_stages] == [500, 2000, 5000, 10000]
    bot = get_scenario("E")
    assert bot.kind == TrafficScenarioKind.BOT_SURGE
    assert bot.persona_mix[PersonaKind.SUSPICIOUS.value] == 2000
    infra = get_scenario("F")
    assert infra.chaos.failure_mode == ChaosFailureMode.DATABASE_SLOWDOWN
    assert infra.chaos.injected_latency_ms == 100.0
    assert set(SCENARIOS) == set(TrafficScenarioKind)


def test_chaos_database_slowdown_is_five_x() -> None:
    router = DigitalTwinRouter()
    injector = ChaosInjector(router)
    from contracts.simulation import ChaosInjectionConfig

    runtime = injector.apply(
        ChaosInjectionConfig(
            target_service="SeatInventoryDB",
            failure_mode=ChaosFailureMode.DATABASE_SLOWDOWN,
            injected_latency_ms=100.0,
        )
    )
    assert runtime.db_latency_multiplier == 5.0
    assert router.graph.nodes["SeatInventoryDB"].health == 0.4
    snap = injector.snapshot()
    assert snap["db_latency_ms"] == 100.0


def test_chaos_outage_returns_503() -> None:
    router = DigitalTwinRouter()
    injector = ChaosInjector(router)
    from contracts.simulation import ChaosInjectionConfig

    injector.apply(
        ChaosInjectionConfig(
            target_service="SeatInventoryDB",
            failure_mode=ChaosFailureMode.SERVICE_UNRESPONSIVE,
        )
    )
    res = router.handle_request(
        "POST",
        "/api/v0/availability",
        {"train_no": "12301", "travel_date": "2026-08-22", "class_type": "SL"},
    )
    assert res["status"] == 503
    search = router.handle_request(
        "GET", "/api/v0/trains/search", {"source": "HWH", "destination": "NDLS"}
    )
    assert search["status"] == 200


def test_overload_grows_with_users_and_chaos() -> None:
    assert overload_probability(1000) < overload_probability(5000)
    assert overload_probability(5000) < overload_probability(10000)
    assert overload_probability(10000, db_slow=True) > overload_probability(10000)


def test_normal_scenario_keeps_critical_journey() -> None:
    engine = PrayogEngine()
    summary = engine.run("NORMAL", population=120, seed=11)
    assert summary.simulated_users == 120
    assert summary.verdict.maintained is True
    assert summary.verdict.legit_dropped / max(summary.verdict.legit_completed, 1) < 0.2


def test_bot_surge_throttles_suspicious_more_than_legit() -> None:
    engine = PrayogEngine()
    summary = engine.run("BOT_SURGE", population=150, seed=19)
    assert summary.verdict.suspicious_total > 0
    assert summary.verdict.suspicious_throttled >= 1
    assert summary.outcomes.get("throttled", 0) >= 1


def test_infra_degradation_dhara_protects_inventory() -> None:
    engine = PrayogEngine()
    summary = engine.run("INFRA_DEGRADATION", population=200, seed=23)
    verdict = summary.verdict
    assert verdict.database_protection_enabled is True
    assert verdict.dhara_state in {"QUEUE_ACTIVATED", "LOAD_SHEDDING"}
    assert "SeatInventoryDB" in verdict.protected_services
    assert "BookingEngine" in verdict.protected_services
    assert verdict.maintained is True
    assert any(
        name in verdict.shed_features
        for name in ("SearchService_uncached", "NotificationDispatcher", "recommendations", "analytics")
    )


def test_spike_uses_last_stage_population() -> None:
    engine = PrayogEngine()
    summary = engine.run_spike(population_cap=80, seed=5)
    assert summary.scenario == TrafficScenarioKind.SUDDEN_SPIKE
    assert summary.target_virtual_users == 10000
    assert summary.simulated_users == 80
    assert summary.verdict.maintained is True


def test_prayog_api_lists_and_runs() -> None:
    client = TestClient(app)
    listed = client.get("/api/v1/prayog/scenarios")
    assert listed.status_code == 200
    assert len(listed.json()["scenarios"]) == 6
    personas = client.get("/api/v1/prayog/personas")
    assert personas.json()["mix_10k"]["NORMAL"] == 5500
    ran = client.post("/api/v1/prayog/run", json={"scenario": "A", "population": 60})
    assert ran.status_code == 200
    body = ran.json()["run"]
    assert body["verdict"]["maintained"] is True
    last = client.get("/api/v1/prayog/last")
    assert last.status_code == 200
    assert last.json()["run"]["run_id"] == body["run_id"]


def test_locust_persona_weights_match_mix() -> None:
    from simulation.personas.catalog import LOCUST_WEIGHTS

    assert LOCUST_WEIGHTS[PersonaKind.NORMAL] == 55
    assert sum(LOCUST_WEIGHTS.values()) == 100
