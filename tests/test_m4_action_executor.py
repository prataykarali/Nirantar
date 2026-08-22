"""
NIRANTAR Module 4 / Action Executor Test Suite
===============================================
Tests:
1. Action allowlist validation (valid vs invalid actions).
2. Circuit breaker state transitions (CLOSED -> OPEN on failure -> HALF_OPEN -> CLOSED recovery).
3. Fallback Digital Twin execution when circuit is OPEN.
4. Kavach security verdict integration with action dispatching.
5. FastAPI /api/v1/executor/* endpoints.
"""

import time
from typing import Any, Dict
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.app.api.executor import router as executor_router
from backend.app.main import app
from backend.app.services.executor.allowlist import (
    ActionAllowlist,
    ActionNotAllowedError,
)
from backend.app.services.executor.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
)
from backend.app.services.executor.dispatcher import ActionDispatcher, dispatcher
from contracts.security import AccessControlVerdict, ThreatCategory
from security.gateway import KavachGateway

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Action Allowlist Validation
# -----------------------------------------------------------------------------
def test_action_allowlist_permitted_actions() -> None:
    """Verify all expected permitted actions are allowlisted."""
    allowlist = ActionAllowlist()
    expected = {
        "search_train",
        "filter_results",
        "focus_element",
        "prepare_autofill",
        "explain_payment",
        "check_payment_status",
    }
    assert set(allowlist.permitted_actions) == expected
    for action in expected:
        assert allowlist.is_allowed(action) is True
        allowed, ctx = allowlist.validate_action(action)
        assert allowed is True
        assert ctx["allowed"] is True
        assert ctx["error_code"] is None


def test_action_allowlist_invalid_actions() -> None:
    """Verify invalid or dangerous action names are rejected."""
    allowlist = ActionAllowlist()
    forbidden_actions = ["delete_user", "exec_code", "drop_database", "admin_override", "", "   ", None]

    for action in forbidden_actions:
        assert allowlist.is_allowed(action) is False
        allowed, ctx = allowlist.validate_action(action)
        assert allowed is False
        assert ctx["allowed"] is False
        assert ctx["error_code"] in ("ACTION_NOT_ALLOWLISTED", "INVALID_ACTION_NAME")

        with pytest.raises(ActionNotAllowedError):
            allowlist.enforce(action)


def test_action_allowlist_normalization() -> None:
    """Verify whitespace and case normalization in allowlist checks."""
    allowlist = ActionAllowlist()
    assert allowlist.is_allowed("  SEARCH_TRAIN  ") is True
    assert allowlist.is_allowed("PREPARE_AUTOFILL") is True

    res = allowlist.enforce("  Check_Payment_Status  ")
    assert res["action"] == "check_payment_status"


def test_action_allowlist_custom_set() -> None:
    """Verify ActionAllowlist with custom allowed actions."""
    custom = ActionAllowlist(custom_allowlist={"custom_action", "search_train"})
    assert custom.is_allowed("custom_action") is True
    assert custom.is_allowed("search_train") is True
    assert custom.is_allowed("filter_results") is False


# -----------------------------------------------------------------------------
# 2. Circuit Breaker State Machine & Transitions
# -----------------------------------------------------------------------------
def test_circuit_breaker_initial_state() -> None:
    """Verify circuit breaker initializes to CLOSED state."""
    cb = CircuitBreaker()
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True
    status = cb.get_status()
    assert status["state"] == "CLOSED"
    assert status["consecutive_failures"] == 0


def test_circuit_breaker_trip_on_consecutive_failures() -> None:
    """Verify circuit trips from CLOSED to OPEN after failure threshold reached."""
    cb = CircuitBreaker(failure_threshold=3)
    assert cb.state == CircuitState.CLOSED

    cb.record_failure(reason="Failure 1")
    cb.record_failure(reason="Failure 2")
    assert cb.state == CircuitState.CLOSED

    cb.record_failure(reason="Failure 3")
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False
    assert "consecutive failures" in cb.get_status()["last_trip_reason"].lower()


def test_circuit_breaker_trip_on_consecutive_timeouts() -> None:
    """Verify circuit trips from CLOSED to OPEN after timeout threshold reached."""
    cb = CircuitBreaker(consecutive_timeout_threshold=2)
    assert cb.state == CircuitState.CLOSED

    cb.record_failure(is_timeout=True, reason="Timeout 1")
    assert cb.state == CircuitState.CLOSED

    cb.record_failure(is_timeout=True, reason="Timeout 2")
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False
    assert "timeouts" in cb.get_status()["last_trip_reason"].lower()


def test_circuit_breaker_recovery_flow() -> None:
    """Verify state transitions: CLOSED -> OPEN -> HALF_OPEN -> CLOSED recovery."""
    cb = CircuitBreaker(
        failure_threshold=2,
        recovery_timeout=0.1,
        half_open_success_threshold=2,
    )

    cb.record_failure(reason="F1")
    cb.record_failure(reason="F2")
    assert cb.state == CircuitState.OPEN

    time.sleep(0.15)
    assert cb.state == CircuitState.HALF_OPEN
    assert cb.can_execute() is True

    cb.record_success()
    assert cb.state == CircuitState.HALF_OPEN

    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True


def test_circuit_breaker_half_open_failure_re_trips() -> None:
    """Verify failure during HALF_OPEN re-trips circuit back to OPEN."""
    cb = CircuitBreaker(
        failure_threshold=2,
        recovery_timeout=0.1,
        half_open_success_threshold=2,
    )

    cb.record_failure(reason="F1")
    cb.record_failure(reason="F2")
    assert cb.state == CircuitState.OPEN

    time.sleep(0.15)
    assert cb.state == CircuitState.HALF_OPEN

    cb.record_failure(reason="Probe failed")
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False


def test_circuit_breaker_manual_trip_and_reset() -> None:
    """Verify manual trip and reset operations."""
    cb = CircuitBreaker()
    assert cb.state == CircuitState.CLOSED

    cb.trip("Emergency overload control")
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    cb.reset()
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True


# -----------------------------------------------------------------------------
# 3. Fallback Digital Twin Execution
# -----------------------------------------------------------------------------
def test_fallback_digital_twin_search_train() -> None:
    """Verify Digital Twin fallback returns train search data when circuit is OPEN."""
    cb = CircuitBreaker()
    cb.trip("Simulated outage")

    payload = {"source": "NDLS", "destination": "HWH"}
    res = cb.execute_fallback("search_train", payload)

    assert res["status"] == 200
    assert res["fallback_served"] is True
    assert res["source"] == "DIGITAL_TWIN_CACHE"
    assert res["action"] == "search_train"
    assert isinstance(res["data"], list)
    assert len(res["data"]) > 0


def test_fallback_digital_twin_all_actions() -> None:
    """Verify Digital Twin fallbacks across all permitted actions."""
    cb = CircuitBreaker()
    cb.trip("Simulated outage")

    actions_to_test = [
        ("filter_results", {"results": [{"train_no": "12301", "fare": 500}], "max_fare": 1000}),
        ("focus_element", {"element_id": "btn-search"}),
        ("prepare_autofill", {}),
        ("explain_payment", {"term": "UPI"}),
        ("check_payment_status", {"booking_id": "BKG-9999"}),
    ]

    for action, payload in actions_to_test:
        res = cb.execute_fallback(action, payload)
        assert res["status"] == 200
        assert res["fallback_served"] is True
        assert res["source"] == "DIGITAL_TWIN_CACHE"
        assert res["action"] == action
        assert "data" in res


# -----------------------------------------------------------------------------
# 4. Kavach Security Verdict Integration & 3-Tier Dispatching
# -----------------------------------------------------------------------------
def test_dispatcher_tier1_allowlist_rejection() -> None:
    """Verify Tier 1 allowlist failure returns status 400."""
    disp = ActionDispatcher()
    res = disp.dispatch("forbidden_shell_cmd", {}, session_id="SESS-001")

    assert res["status"] == 400
    assert res["success"] is False
    assert res["tier_failed"] == "ALLOWLIST"
    assert res["error_code"] == "ACTION_NOT_ALLOWLISTED"
    assert res["fallback_served"] is False


def test_dispatcher_tier2_kavach_security_blocking() -> None:
    """Verify Tier 2 Kavach security blocking returns status 403."""
    disp = ActionDispatcher()

    # Simulate bot behavior triggering BLOCK verdict in Kavach
    bot_session = "SES_M4_BOT_TEST"
    for _ in range(15):
        disp.kavach.evaluate(session_id=bot_session, endpoint="/api/v1/executor/dispatch/search_train", is_retry=True)

    res = disp.dispatch("search_train", {}, session_id=bot_session, is_retry=True)

    assert res["status"] == 403
    assert res["success"] is False
    assert res["tier_failed"] == "KAVACH_SECURITY"
    assert res["error_code"] == "SECURITY_VERDICT_REJECTED"
    assert res["tier_validations"]["security"]["passed"] is False


def test_dispatcher_tier3_normal_execution() -> None:
    """Verify happy path dispatching when allowlist, Kavach, and circuit breaker pass."""
    disp = ActionDispatcher()
    payload = {"source": "HWH", "destination": "NDLS"}
    res = disp.dispatch("search_train", payload, session_id="SESS-LEGIT-001")

    assert res["status"] == 200
    assert res["success"] is True
    assert res["fallback_served"] is False
    assert res["circuit_breaker_state"] == "CLOSED"
    assert res["tier_validations"]["allowlist"]["passed"] is True
    assert res["tier_validations"]["security"]["passed"] is True
    assert res["tier_validations"]["circuit_breaker"]["passed"] is True
    assert res["result"]["count"] >= 1


def test_dispatcher_tier3_circuit_open_fallback() -> None:
    """Verify automatic fallback dispatch when circuit breaker is OPEN."""
    disp = ActionDispatcher()
    disp.circuit_breaker.trip("Test trip for fallback validation")

    payload = {"source": "NDLS", "destination": "HWH"}
    res = disp.dispatch("search_train", payload, session_id="SESS-FALLBACK-001")

    assert res["status"] == 200
    assert res["success"] is True
    assert res["fallback_served"] is True
    assert res["source"] == "DIGITAL_TWIN_CACHE"
    assert res["tier_validations"]["circuit_breaker"]["action_taken"] == "FALLBACK_DISPATCHED"


def test_dispatcher_handler_exception_triggers_fallback() -> None:
    """Verify domain handler exception records failure and returns fallback."""
    disp = ActionDispatcher()

    # Mock domain handler to raise an error
    disp._execute_domain_handler = MagicMock(side_effect=RuntimeError("Backend DB Connection Timeout"))

    res = disp.dispatch("search_train", {}, session_id="SESS-ERR-001")

    assert res["status"] == 200
    assert res["success"] is True
    assert res["fallback_served"] is True
    assert res["tier_validations"]["circuit_breaker"]["action_taken"] == "FALLBACK_DISPATCHED_ON_FAILURE"
    assert disp.circuit_breaker.get_status()["total_failures"] >= 1


# -----------------------------------------------------------------------------
# 5. FastAPI /api/v1/executor/* Endpoints
# -----------------------------------------------------------------------------
def test_api_get_allowlist() -> None:
    """GET /api/v1/executor/allowlist endpoint."""
    res = client.get("/api/v1/executor/allowlist")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == 200
    assert body["count"] == 6
    assert "search_train" in body["allowlist"]


def test_api_get_circuit_status() -> None:
    """GET /api/v1/executor/circuit-status endpoint."""
    dispatcher.circuit_breaker.reset()
    res = client.get("/api/v1/executor/circuit-status")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == 200
    assert body["state"] == "CLOSED"
    assert body["can_execute"] is True


def test_api_circuit_trip_and_reset_endpoints() -> None:
    """POST /api/v1/executor/circuit-trip and POST /api/v1/executor/circuit-reset endpoints."""
    # Trip circuit
    trip_res = client.post(
        "/api/v1/executor/circuit-trip",
        json={"reason": "Testing manual trip via API"},
    )
    assert trip_res.status_code == 200
    assert trip_res.json()["circuit"]["state"] == "OPEN"

    # Verify status is OPEN
    status_res = client.get("/api/v1/executor/circuit-status")
    assert status_res.json()["state"] == "OPEN"

    # Reset circuit
    reset_res = client.post("/api/v1/executor/circuit-reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["circuit"]["state"] == "CLOSED"


def test_api_dispatch_endpoint_success() -> None:
    """POST /api/v1/executor/dispatch happy path."""
    dispatcher.circuit_breaker.reset()
    payload = {
        "action": "search_train",
        "payload": {"source": "NDLS", "destination": "HWH"},
        "session_id": "SESS-API-001",
    }
    res = client.post("/api/v1/executor/dispatch", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["action"] == "search_train"
    assert body["fallback_served"] is False


def test_api_dispatch_endpoint_allowlist_error() -> None:
    """POST /api/v1/executor/dispatch with forbidden action returns 400."""
    payload = {
        "action": "invalid_action_xyz",
        "payload": {},
        "session_id": "SESS-API-ERR",
    }
    res = client.post("/api/v1/executor/dispatch", json=payload)
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["tier_failed"] == "ALLOWLIST"
    assert body["error_code"] == "ACTION_NOT_ALLOWLISTED"


def test_api_dispatch_endpoint_fallback_when_open() -> None:
    """POST /api/v1/executor/dispatch returns fallback when circuit is OPEN."""
    client.post("/api/v1/executor/circuit-trip", json={"reason": "Testing API fallback"})

    payload = {
        "action": "explain_payment",
        "payload": {"term": "UPI"},
        "session_id": "SESS-API-FALLBACK",
    }
    res = client.post("/api/v1/executor/dispatch", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["fallback_served"] is True
    assert body["source"] == "DIGITAL_TWIN_CACHE"

    # Reset circuit after test
    client.post("/api/v1/executor/circuit-reset")
