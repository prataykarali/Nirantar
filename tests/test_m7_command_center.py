"""
NIRANTAR Module 7 — Command Center & Dhara Self-Healing Test Suite.
==================================================================
Tests:
  1. Real-time telemetry snapshot generation.
  2. Dhara load shedding level transition math (Level 0 to Level 3).
  3. Self-healing auto-trip and auto-recovery triggers under artificial latency & queue pressure.
  4. FastAPI `/api/v1/command-center/*` endpoints.
"""

import time
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.api.command_center import orchestrator, service as cc_service
from backend.app.core.runtime import prayog, twin
from backend.app.services.command_center.dhara import DharaSelfHealingEngine
from backend.app.services.executor.circuit_breaker import CircuitBreaker, CircuitState
from contracts.orchestration import ResilienceState
from orchestrator.decision_engine.engine import DharaEngine
from orchestrator.resilience.load_shed import LoadShedPolicy

client = TestClient(app)


# =====================================================================
# 1. Real-time Telemetry Snapshot Generation
# =====================================================================

def test_snapshot_has_control_loop_fields() -> None:
    """Verify real-time telemetry snapshot contains all control loop fields."""
    res = client.get("/api/v1/command-center/snapshot")
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    assert {"live", "forecast", "security", "nodes", "actions", "timeline"} <= set(snap)

    live = snap["live"]
    for key in (
        "concurrent_users",
        "requests_per_sec",
        "cpu_percent",
        "latency_ms",
        "error_rate_pct",
        "ram_percent",
        "db_queue_depth",
        "circuit_breaker_state",
        "threat_mitigation_rate",
    ):
        assert key in live

    forecast = snap["forecast"]
    for key in ("current_users", "plus_5_min_users", "plus_10_min_users", "safe_capacity_users"):
        assert key in forecast

    security = snap["security"]
    for key in ("legitimate", "suspicious", "blocked", "throttled"):
        assert key in security

    labels = {n["label"] for n in snap["nodes"]}
    assert labels == {"AUTH", "BOOKING", "DB", "PAYMENT"}
    assert len(snap["actions"]) == 5
    assert snap["timeline"]


def test_collect_telemetry_aggregation() -> None:
    """Verify telemetry collection returns expected aggregated metrics."""
    telemetry = orchestrator.collect_telemetry()
    assert "cpu_percent" in telemetry
    assert "ram_percent" in telemetry
    assert "concurrent_users" in telemetry
    assert "p95_latency_ms" in telemetry
    assert "db_queue_depth" in telemetry
    assert "circuit_breaker_state" in telemetry
    assert "threat_mitigation_rate" in telemetry
    assert telemetry["threat_mitigation_rate"] >= 0.0


# =====================================================================
# 2. Dhara Load Shedding Level Transition Math (Level 0 to Level 3)
# =====================================================================

def test_dhara_load_shedding_level_transitions() -> None:
    """Test Dhara Self-Healing Engine level calculation math (Level 0 to Level 3)."""
    engine = DharaSelfHealingEngine()
    engine._recovery_hold_seconds = 0.0

    # Level 0 (NORMAL): Nominal telemetry
    status_0 = engine.evaluate_telemetry({
        "cpu_percent": 30.0,
        "p95_latency_ms": 120.0,
        "db_queue_depth": 5,
        "error_rate_pct": 1.0,
    })
    assert status_0["level"] == 0
    assert any("LEVEL_0_NOMINAL" in p for p in status_0["active_policies"])

    # Level 1 (MILD): Mild load threshold (CPU >= 60 or p95 >= 300)
    status_1 = engine.evaluate_telemetry({
        "cpu_percent": 65.0,
        "p95_latency_ms": 320.0,
        "db_queue_depth": 35,
        "error_rate_pct": 4.5,
    })
    assert status_1["level"] == 1
    assert any("LEVEL_1_MILD" in p for p in status_1["active_policies"])

    # Level 2 (MODERATE): High load threshold (CPU >= 75 or p95 >= 500)
    status_2 = engine.evaluate_telemetry({
        "cpu_percent": 78.0,
        "p95_latency_ms": 550.0,
        "db_queue_depth": 85,
        "error_rate_pct": 12.0,
    })
    assert status_2["level"] == 2
    assert any("LEVEL_2_MODERATE" in p for p in status_2["active_policies"])

    # Level 3 (SEVERE): Critical load threshold (CPU >= 85 or p95 >= 1000)
    status_3 = engine.evaluate_telemetry({
        "cpu_percent": 88.0,
        "p95_latency_ms": 1200.0,
        "db_queue_depth": 160,
        "error_rate_pct": 28.0,
    })
    assert status_3["level"] == 3
    assert any("LEVEL_3_SEVERE" in p for p in status_3["active_policies"])


def test_dhara_engine_resilience_state_math() -> None:
    """Test Dhara decision engine state math and load shedding policy feature disabling."""
    dhara = DharaEngine()
    policy = LoadShedPolicy()

    # Level 0 equivalent: NORMAL
    dec_norm = dhara.decide(overload_probability=0.2, suspicious_sessions=10)
    assert dec_norm.current_state == ResilienceState.NORMAL
    assert dec_norm.queue.should_enqueue is False

    # Level 1 equivalent: ELEVATED_MONITORING (high risk traffic)
    dec_elev = dhara.decide(overload_probability=0.4, suspicious_sessions=600)
    assert dec_elev.current_state == ResilienceState.ELEVATED_MONITORING

    # Level 2 equivalent: QUEUE_ACTIVATED (overload >= 0.75)
    dec_queue = dhara.decide(overload_probability=0.8, suspicious_sessions=100)
    assert dec_queue.current_state == ResilienceState.QUEUE_ACTIVATED
    assert dec_queue.queue.should_enqueue is True

    # Level 3 equivalent: LOAD_SHEDDING (overload >= 0.9)
    dec_shed = dhara.decide(overload_probability=0.92, suspicious_sessions=100)
    assert dec_shed.current_state == ResilienceState.LOAD_SHEDDING
    assert dec_shed.database_protection_enabled is True

    # Load Shed Policy Feature Disabling Math
    disabled_mod = policy.features_to_disable(overloaded=True, inventory_critical=False)
    assert set(disabled_mod) == {"analytics", "non_critical_refresh", "recommendations"}

    disabled_sev = policy.features_to_disable(overloaded=True, inventory_critical=True)
    assert "NotificationDispatcher" in disabled_sev
    assert "SearchService_uncached" in disabled_sev


# =====================================================================
# 3. Self-Healing Auto-Trip & Auto-Recovery Triggers
# =====================================================================

def test_self_healing_auto_trip_under_artificial_latency() -> None:
    """Test auto-trip trigger when downstream latency & timeout threshold is breached."""
    cb = CircuitBreaker(failure_threshold=5, consecutive_timeout_threshold=3)
    engine = DharaSelfHealingEngine(circuit_breaker=cb)

    assert cb.state == CircuitState.CLOSED

    # Artificial latency & consecutive timeout pressure
    status = engine.evaluate_telemetry({
        "p95_latency_ms": 2500.0,
        "consecutive_timeouts": 3,
        "error_rate_pct": 55.0,
    })

    assert status["circuit_breaker_state"] == "OPEN"
    assert cb.state == CircuitState.OPEN

    logs = engine.get_logs()
    assert any(log.event_type == "AUTO_CIRCUIT_TRIP" for log in logs)


def test_self_healing_auto_recovery_under_normalized_load() -> None:
    """Test auto-recovery from Level 3 -> Level 2 -> Level 1 -> Level 0 after load normalizes."""
    cb = CircuitBreaker()
    engine = DharaSelfHealingEngine(circuit_breaker=cb)
    engine._recovery_hold_seconds = 0.0  # Allow immediate step-down for unit test

    # Escalate to Level 3
    engine.evaluate_telemetry({"cpu_percent": 90.0, "p95_latency_ms": 1100.0})
    assert engine.current_level == 3

    # Normalize telemetry: step 1 (level 3 -> level 2)
    engine.evaluate_telemetry({"cpu_percent": 20.0, "p95_latency_ms": 100.0})
    assert engine.current_level == 2

    # Normalize telemetry: step 2 (level 2 -> level 1)
    engine.evaluate_telemetry({"cpu_percent": 20.0, "p95_latency_ms": 100.0})
    assert engine.current_level == 1

    # Normalize telemetry: step 3 (level 1 -> level 0)
    engine.evaluate_telemetry({"cpu_percent": 20.0, "p95_latency_ms": 100.0})
    assert engine.current_level == 0


def test_circuit_breaker_3_state_transitions() -> None:
    """Test 3-state CircuitBreaker (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)."""
    cb = CircuitBreaker(
        failure_threshold=3,
        consecutive_timeout_threshold=2,
        recovery_timeout=0.05,
        half_open_success_threshold=2,
    )
    assert cb.state == CircuitState.CLOSED

    # Record consecutive failures to trip
    cb.record_failure(is_timeout=True)
    cb.record_failure(is_timeout=True)
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    # Wait for recovery timeout -> transitions to HALF_OPEN
    time.sleep(0.06)
    assert cb.state == CircuitState.HALF_OPEN
    assert cb.can_execute() is True

    # Record 2 successes -> recovers to CLOSED
    cb.record_success()
    cb.record_success()
    assert cb.state == CircuitState.CLOSED


# =====================================================================
# 4. FastAPI /api/v1/command-center/* Endpoints
# =====================================================================

def test_fastapi_command_center_endpoints() -> None:
    """Test all FastAPI /api/v1/command-center/* endpoints."""
    # GET /snapshot
    res_snap = client.get("/api/v1/command-center/snapshot")
    assert res_snap.status_code == 200
    assert res_snap.json()["status"] == 200

    # GET /dhara-control
    res_ctrl_get = client.get("/api/v1/command-center/dhara-control")
    assert res_ctrl_get.status_code == 200
    assert "level" in res_ctrl_get.json()

    # POST /dhara-control
    res_ctrl_post = client.post(
        "/api/v1/command-center/dhara-control",
        json={"level": 2, "reason": "Testing manual level 2 escalation"},
    )
    assert res_ctrl_post.status_code == 200
    assert res_ctrl_post.json()["level"] == 2

    # Reset level back to 0
    client.post("/api/v1/command-center/dhara-control", json={"level": 0})

    # POST /circuit-override TRIP
    res_trip = client.post(
        "/api/v1/command-center/circuit-override",
        json={"action": "TRIP", "reason": "Operator testing trip"},
    )
    assert res_trip.status_code == 200
    assert res_trip.json()["circuit_breaker_state"] == "OPEN"

    # POST /circuit-override RESET
    res_reset = client.post(
        "/api/v1/command-center/circuit-override",
        json={"action": "RESET", "reason": "Operator testing reset"},
    )
    assert res_reset.status_code == 200
    assert res_reset.json()["circuit_breaker_state"] == "CLOSED"

    # GET /self-healing-logs
    res_logs = client.get("/api/v1/command-center/self-healing-logs?limit=10")
    assert res_logs.status_code == 200
    assert res_logs.json()["count"] > 0

    # POST /scenario
    res_scen = client.post(
        "/api/v1/command-center/scenario",
        json={"scenario": "PEAK", "population": 150},
    )
    assert res_scen.status_code == 200
    assert res_scen.json()["snapshot"]["scenario"] == "PEAK"


# =====================================================================
# Existing Module 7 Scenario & Queue Isolation Tests
# =====================================================================

def test_infra_scenario_marks_inventory_bottleneck() -> None:
    twin.graph.nodes["SeatInventoryDB"].health = 1.0
    res = client.post(
        "/api/v1/command-center/scenario",
        json={"scenario": "F", "population": 80},
    )
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    db = next(n for n in snap["nodes"] if n["label"] == "DB")
    assert db["status"] in {"degraded", "down"}
    assert "Inventory DB" in snap["bottleneck_detail"]
    protect = next(a for a in snap["actions"] if a["id"] == "protect_db")
    assert protect["active"] is True
    labels = [e["label"] for e in snap["timeline"]]
    assert any("queue" in lab.lower() or "Overload" in lab or "spike" in lab.lower() for lab in labels)


def test_normal_scenario_keeps_auth_and_booking_up() -> None:
    res = client.post(
        "/api/v1/command-center/scenario",
        json={"scenario": "A", "population": 60},
    )
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    by_label = {n["label"]: n for n in snap["nodes"]}
    assert by_label["AUTH"]["status"] == "healthy"
    assert by_label["BOOKING"]["status"] == "healthy"
    assert snap["security"]["legitimate"] >= snap["security"]["suspicious"]


def test_snapshot_poll_does_not_fill_admission_queue() -> None:
    before = prayog.dhara.queue.depth()
    cc_service.snapshot()
    cc_service.snapshot()
    assert prayog.dhara.queue.depth() == before
