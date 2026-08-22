"""
Tests for Module 6 (PRAYOG 10,000 Synthetic Citizen Engine, Load Balancing, CDN Cache & Chaos Suite).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.api.prayog import router as prayog_router
from backend.app.main import app
from backend.app.services.simulation.prayog import (
    DynamicAdmissionTokenBucket,
    EdgeCDNCacheHeaderManager,
    PrayogEngine,
)
from contracts.simulation import PersonaKind
from m6_prayog.chaos_suite import chaos_suite
from m6_prayog.metrics import SimulationMetricsTracker, telemetry_tracker
from simulation.personas.catalog import DEMOGRAPHIC_MIX_10K, scaled_mix

client = TestClient(app)


def test_demographic_mix_distribution() -> None:
    assert sum(DEMOGRAPHIC_MIX_10K.values()) == 10000
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.RURAL] == 3500  # 35%
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.TATKAL_RUSH] == 3000  # 30%
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.COMMUTER] == 2000  # 20%
    assert DEMOGRAPHIC_MIX_10K[PersonaKind.BOT_SCALPER] == 1500  # 15%

    scaled = scaled_mix(100, DEMOGRAPHIC_MIX_10K)
    assert sum(scaled.values()) == 100
    assert scaled[PersonaKind.RURAL] == 35
    assert scaled[PersonaKind.TATKAL_RUSH] == 30
    assert scaled[PersonaKind.COMMUTER] == 20
    assert scaled[PersonaKind.BOT_SCALPER] == 15


def test_dynamic_admission_token_bucket() -> None:
    bucket = DynamicAdmissionTokenBucket(base_capacity=100, base_refill_rate=20.0)
    assert bucket.consume(10) is True

    # Adjust for surge load
    bucket.adjust_for_load(0.9, is_tatkal_surge=True)
    status = bucket.get_status()
    assert status["capacity"] == 40  # 40% of base_capacity under surge
    assert status["total_admitted"] >= 10


def test_edge_cdn_cache_header_manager() -> None:
    static_headers = EdgeCDNCacheHeaderManager.get_headers("stations")
    assert "public" in static_headers["Cache-Control"]
    assert "s-maxage=86400" in static_headers["Cache-Control"]

    search_headers = EdgeCDNCacheHeaderManager.get_headers("search")
    assert "s-maxage=300" in search_headers["Cache-Control"]

    availability_headers = EdgeCDNCacheHeaderManager.get_headers("availability")
    assert "s-maxage=10" in availability_headers["Cache-Control"]

    booking_headers = EdgeCDNCacheHeaderManager.get_headers("booking")
    assert "private" in booking_headers["Cache-Control"]
    assert "no-store" in booking_headers["Cache-Control"]

    rules = EdgeCDNCacheHeaderManager.list_rules()
    assert len(rules) == 4


def test_tatkal_surge_shedding() -> None:
    engine = PrayogEngine()
    surge_status = engine.trigger_tatkal_surge(True)
    assert surge_status["tatkal_surge_active"] is True
    assert surge_status["dhara_load_shedding"] is True
    assert len(surge_status["shed_features"]) > 0
    assert "BookingEngine" in surge_status["protected_services"]

    deactive_status = engine.trigger_tatkal_surge(False)
    assert deactive_status["tatkal_surge_active"] is False


def test_chaos_suite_scenarios_a_to_f() -> None:
    scenarios = chaos_suite.list_scenarios()
    assert len(scenarios) == 6
    ids = [s["id"] for s in scenarios]
    assert set(ids) == {"A", "B", "C", "D", "E", "F"}

    summary = chaos_suite.run_scenario("A", population=50)
    assert summary.simulated_users == 50
    assert summary.verdict.maintained is True


def test_telemetry_metrics_tracker() -> None:
    tracker = SimulationMetricsTracker()
    tracker.record_request(latency_ms=30.0, is_bot=False, legit_success=True)
    tracker.record_request(latency_ms=250.0, is_bot=True, bot_throttled=True, legit_success=False)

    snapshot = tracker.get_snapshot()
    assert snapshot.total_requests == 2
    assert snapshot.total_bots_detected == 1
    assert snapshot.total_bots_throttled == 1
    assert snapshot.bot_mitigation_rate == 1.0


def test_prayog_api_endpoints() -> None:
    personas_res = client.get("/api/v1/prayog/personas")
    assert personas_res.status_code == 200
    data = personas_res.json()
    assert data["demographic_mix_10k"]["RURAL"] == 3500
    assert data["demographic_mix_10k"]["TATKAL_RUSH"] == 3000

    load_balance_res = client.get("/api/v1/prayog/load-balance-status")
    assert load_balance_res.status_code == 200
    assert "token_bucket" in load_balance_res.json()["data"]

    metrics_res = client.get("/api/v1/prayog/metrics")
    assert metrics_res.status_code == 200
    assert "p95_latency_ms" in metrics_res.json()["metrics"]

    run_scenario_res = client.post("/api/v1/prayog/run-scenario", json={"scenario": "B", "population": 40})
    assert run_scenario_res.status_code == 200
    assert run_scenario_res.json()["run"]["simulated_users"] == 40

    stop_res = client.post("/api/v1/prayog/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["stop_result"]["status"] == "stopped"
