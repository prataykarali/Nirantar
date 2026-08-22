"""
PRAYOG — 10,000 Virtual Citizens, Load Balancing, CDN Cache, Chaos Suite & FastAPI Endpoints Test Suite.
"""

from __future__ import annotations

from collections import Counter

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.simulation.prayog import (
    DynamicAdmissionTokenBucket,
    EdgeCDNCacheHeaderManager,
    PrayogEngine,
)
from contracts.simulation import (
    ChaosFailureMode,
    ChaosInjectionConfig,
    DeviceType,
    JourneyStep,
    PersonaKind,
    TrafficScenarioKind,
    VirtualCitizen,
)
from m0_digital_twin.railway_api import DigitalTwinRouter
from m6_prayog.chaos_suite import chaos_suite
from security.gateway import KavachGateway
from simulation.chaos.injector import ChaosInjector
from simulation.personas.catalog import (
    DEFAULT_MIX_10K,
    DEMOGRAPHIC_MIX_10K,
    LOCUST_WEIGHTS,
    scaled_mix,
)
from simulation.personas.factory import build_population
from simulation.scenarios.catalog import SCENARIOS, get_scenario
from simulation.walker import overload_probability

client = TestClient(app)


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


def test_demographic_mix_10k_math() -> None:
    """Exact 10,000 persona demographic distribution math (35% Rural, 30% Tatkal Rush, 20% Commuter, 15% Bot/Scalper)."""
    assert sum(DEMOGRAPHIC_MIX_10K.values()) == 10000
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.RURAL] == 3500  # 35% Rural
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.TATKAL_RUSH] == 3000  # 30% Tatkal Rush
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.COMMUTER] == 2000  # 20% Commuter
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.BOT_SCALPER] == 1500  # 15% Bot/Scalper

    scaled = scaled_mix(100, DEMOGRAPHIC_MIX_10K)
    assert sum(scaled.values()) == 100
    assert scaled[PersonaKind.RURAL] == 35
    assert scaled[PersonaKind.TATKAL_RUSH] == 30
    assert scaled[PersonaKind.COMMUTER] == 20
    assert scaled[PersonaKind.BOT_SCALPER] == 15


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


def test_dynamic_admission_token_bucket() -> None:
    """Load balancing: Token bucket rate-limiting and burst token management."""
    bucket = DynamicAdmissionTokenBucket(base_capacity=100, base_refill_rate=20.0)
    assert bucket.consume(10) is True

    # Adjust for surge / overload
    bucket.adjust_for_load(0.9, is_tatkal_surge=True)
    status = bucket.get_status()
    assert status["capacity"] == 40  # 40% of base_capacity under surge
    assert status["total_admitted"] >= 10


def test_edge_cdn_cache_header_injection() -> None:
    """CDN edge cache header injection (Cache-Control, s-maxage headers)."""
    static_headers = EdgeCDNCacheHeaderManager.get_headers("stations")
    assert "public" in static_headers["Cache-Control"]
    assert "s-maxage=86400" in static_headers["Cache-Control"]
    assert static_headers["Edge-Cache-Policy"] == "STATIC_IMMUTABLE"

    search_headers = EdgeCDNCacheHeaderManager.get_headers("search")
    assert "public" in search_headers["Cache-Control"]
    assert "s-maxage=300" in search_headers["Cache-Control"]
    assert search_headers["Edge-Cache-Policy"] == "READ_HEAVY_CACHED"

    availability_headers = EdgeCDNCacheHeaderManager.get_headers("availability")
    assert "public" in availability_headers["Cache-Control"]
    assert "s-maxage=10" in availability_headers["Cache-Control"]
    assert availability_headers["Edge-Cache-Policy"] == "HIGH_VOLATILITY_SHORT_TTL"

    booking_headers = EdgeCDNCacheHeaderManager.get_headers("booking")
    assert "private" in booking_headers["Cache-Control"]
    assert "no-store" in booking_headers["Cache-Control"]
    assert booking_headers["Edge-Cache-Policy"] == "ZERO_CACHE_TRANSACTIONAL"

    rules = EdgeCDNCacheHeaderManager.list_rules()
    assert len(rules) == 4


def test_scenarios_a_through_f() -> None:
    """Verify configuration of all 6 Chaos Scenarios (A through F)."""
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

    scenarios = chaos_suite.list_scenarios()
    assert len(scenarios) == 6
    ids = [s["id"] for s in scenarios]
    assert set(ids) == {"A", "B", "C", "D", "E", "F"}


def test_chaos_database_slowdown_is_five_x() -> None:
    router = DigitalTwinRouter()
    injector = ChaosInjector(router)

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


def test_kavach_bot_storm_throttling_under_15_percent_scalper_load() -> None:
    """Kavach bot storm throttling under 15% scalper load."""
    gateway = KavachGateway()
    # Simulate scalper bot repeated search/booking calls from suspicious session
    session_id = "SES-bot-scalper-99"
    throttled_count = 0
    for i in range(20):
        _assessment, allowed, reason = gateway.evaluate(
            session_id=session_id,
            endpoint="SEARCH",
            ip_hash="scalper_ip_storm",
            is_retry=(i > 5),
        )
        if not allowed or reason in {"rate_limited", "throttled", "blocked"}:
            throttled_count += 1

    assert throttled_count >= 1

    # Run engine with demographic mix containing 15% bot/scalpers
    engine = PrayogEngine()
    summary = engine.run("BOT_SURGE", population=200, seed=19, use_demographic_mix=True)
    assert summary.verdict.suspicious_total > 0
    assert summary.verdict.suspicious_throttled >= 1
    assert summary.outcomes.get("throttled", 0) >= 1


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


def test_fastapi_prayog_endpoints() -> None:
    """Test all FastAPI `/api/v1/prayog/*` endpoints."""
    # List scenarios
    listed = client.get("/api/v1/prayog/scenarios")
    assert listed.status_code == 200
    assert len(listed.json()["scenarios"]) == 6

    # Personas listing
    personas = client.get("/api/v1/prayog/personas")
    assert personas.status_code == 200
    pdata = personas.json()
    assert pdata["mix_10k"]["NORMAL"] == 5500
    assert pdata["demographic_mix_10k"]["RURAL"] == 3500

    # Load balancing status
    lb_res = client.get("/api/v1/prayog/load-balance-status")
    assert lb_res.status_code == 200
    assert "token_bucket" in lb_res.json()["data"]
    assert "cdn_cache_rules" in lb_res.json()["data"]

    # Metrics
    metrics_res = client.get("/api/v1/prayog/metrics")
    assert metrics_res.status_code == 200
    assert "p95_latency_ms" in metrics_res.json()["metrics"]

    # Run scenario
    ran = client.post("/api/v1/prayog/run", json={"scenario": "A", "population": 60})
    assert ran.status_code == 200
    body = ran.json()["run"]
    assert body["verdict"]["maintained"] is True

    # Run scenario by endpoint
    ran_scen = client.post("/api/v1/prayog/run-scenario", json={"scenario": "B", "population": 40})
    assert ran_scen.status_code == 200
    assert ran_scen.json()["run"]["simulated_users"] == 40

    # Last run
    last = client.get("/api/v1/prayog/last")
    assert last.status_code == 200
    assert last.json()["run"]["run_id"] == ran_scen.json()["run"]["run_id"]

    # Inject chaos
    chaos_res = client.post(
        "/api/v1/prayog/chaos",
        json={"failure_mode": "DATABASE_SLOWDOWN", "injected_latency_ms": 50.0},
    )
    assert chaos_res.status_code == 200

    # Stop simulation
    stop_res = client.post("/api/v1/prayog/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["stop_result"]["status"] == "stopped"


def test_locust_persona_weights_match_mix() -> None:
    assert LOCUST_WEIGHTS[PersonaKind.NORMAL] == 55
    assert sum(LOCUST_WEIGHTS.values()) == 100
