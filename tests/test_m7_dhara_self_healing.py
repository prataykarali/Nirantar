"""
NIRANTAR Module 7 Test Suite — Dhara Adaptive Self-Healing & Dynamic Command Center Orchestration
==================================================================================================
Tests:
  - Telemetry aggregation in CommandCenterOrchestrator
  - Automated threshold load shedding (Levels 0-3)
  - Auto-circuit trip on downstream consecutive timeouts
  - Auto-recovery after normalized load duration (>10s)
  - Audit logging of self-healing events
  - API router endpoints (/snapshot, /dhara-control, /circuit-override, /self-healing-logs)
"""

import time
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.command_center.dhara import DharaSelfHealingEngine
from backend.app.services.command_center.orchestrator import CommandCenterOrchestrator
from backend.app.services.executor.circuit_breaker import CircuitBreaker, CircuitState

client = TestClient(app)


def test_orchestrator_telemetry_aggregation() -> None:
    orchestrator = CommandCenterOrchestrator()
    telemetry = orchestrator.collect_telemetry()

    assert "cpu_percent" in telemetry
    assert "ram_percent" in telemetry
    assert "active_citizens" in telemetry
    assert "requests_per_sec" in telemetry
    assert "p95_latency_ms" in telemetry
    assert "db_queue_depth" in telemetry
    assert "circuit_breaker_state" in telemetry
    assert "threat_mitigation_rate" in telemetry
    assert telemetry["circuit_breaker_state"] in {"CLOSED", "OPEN", "HALF_OPEN"}
    assert 0.0 <= telemetry["threat_mitigation_rate"] <= 1.0


def test_dhara_load_shedding_level_thresholds() -> None:
    cb = CircuitBreaker()
    engine = DharaSelfHealingEngine(circuit_breaker=cb)

    # Level 0: Normal
    status0 = engine.evaluate_telemetry({"cpu_percent": 30.0, "p95_latency_ms": 100.0, "db_queue_depth": 10})
    assert status0["level"] == 0

    # Level 1: Mild overload
    status1 = engine.evaluate_telemetry({"cpu_percent": 65.0, "p95_latency_ms": 350.0, "db_queue_depth": 40})
    assert status1["level"] == 1

    # Level 2: Moderate overload
    status2 = engine.evaluate_telemetry({"cpu_percent": 78.0, "p95_latency_ms": 600.0, "db_queue_depth": 90})
    assert status2["level"] == 2

    # Level 3: Severe overload
    status3 = engine.evaluate_telemetry({"cpu_percent": 88.0, "p95_latency_ms": 1200.0, "db_queue_depth": 160})
    assert status3["level"] == 3


def test_dhara_auto_circuit_trip_on_consecutive_timeouts() -> None:
    cb = CircuitBreaker()
    engine = DharaSelfHealingEngine(circuit_breaker=cb)

    assert cb.state == CircuitState.CLOSED

    # Telemetry with consecutive timeouts
    engine.evaluate_telemetry({
        "cpu_percent": 50.0,
        "consecutive_timeouts": 3,
        "p95_latency_ms": 2500.0,
        "error_rate_pct": 55.0,
    })

    assert cb.state == CircuitState.OPEN
    logs = engine.get_logs()
    assert any(log.event_type == "AUTO_CIRCUIT_TRIP" for log in logs)


def test_dhara_auto_recovery_after_normalization_window() -> None:
    cb = CircuitBreaker()
    engine = DharaSelfHealingEngine(circuit_breaker=cb)
    # Set short recovery hold for testing speed
    engine._recovery_hold_seconds = 0.2

    # Escalate to Level 2
    engine.evaluate_telemetry({"cpu_percent": 78.0, "p95_latency_ms": 600.0, "db_queue_depth": 90})
    assert engine.current_level == 2

    # Provide clean telemetry for recovery duration
    engine.evaluate_telemetry({"cpu_percent": 25.0, "p95_latency_ms": 80.0, "db_queue_depth": 5})
    time.sleep(0.25)
    # Next evaluation should step down level towards 0
    engine.evaluate_telemetry({"cpu_percent": 25.0, "p95_latency_ms": 80.0, "db_queue_depth": 5})
    assert engine.current_level < 2

    logs = engine.get_logs()
    assert any(log.event_type == "AUTO_RECOVERY" for log in logs)


def test_api_snapshot_endpoint() -> None:
    res = client.get("/api/v1/command-center/snapshot")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == 200
    snap = data["snapshot"]
    assert "live" in snap
    assert "ram_percent" in snap["live"]
    assert "p95_latency_ms" in snap["live"]
    assert "db_queue_depth" in snap["live"]
    assert "circuit_breaker_state" in snap["live"]
    assert "threat_mitigation_rate" in snap["live"]
    assert "dhara_level" in snap


def test_api_dhara_control_get_and_post() -> None:
    # GET control status
    get_res = client.get("/api/v1/command-center/dhara-control")
    assert get_res.status_code == 200
    assert "level" in get_res.json()

    # POST override level to 2
    post_res = client.post("/api/v1/command-center/dhara-control", json={"level": 2, "reason": "Test high load override"})
    assert post_res.status_code == 200
    body = post_res.json()
    assert body["level"] == 2
    assert body["status"] == 200

    # POST toggle auto healing back on
    toggle_res = client.post("/api/v1/command-center/dhara-control", json={"auto_healing_enabled": True})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["auto_healing_enabled"] is True


def test_api_circuit_override_endpoint() -> None:
    # Manual trip
    trip_res = client.post("/api/v1/command-center/circuit-override", json={"action": "TRIP", "reason": "Operator manual test"})
    assert trip_res.status_code == 200
    assert trip_res.json()["circuit_breaker_state"] == "OPEN"

    # Manual reset
    reset_res = client.post("/api/v1/command-center/circuit-override", json={"action": "RESET", "reason": "Operator manual recovery"})
    assert reset_res.status_code == 200
    assert reset_res.json()["circuit_breaker_state"] == "CLOSED"


def test_api_self_healing_logs_endpoint() -> None:
    res = client.get("/api/v1/command-center/self-healing-logs?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == 200
    assert "logs" in data
    assert isinstance(data["logs"], list)
    assert len(data["logs"]) > 0
