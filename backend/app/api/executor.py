"""
NIRANTAR Module 4 — Action Executor & Resilient Dispatch API Endpoints
======================================================================
FastAPI endpoints for 3-tier validated action dispatching, allowlist inspection,
circuit breaker status monitoring, and manual circuit resets.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, Query, Response
from pydantic import BaseModel, Field

from backend.app.services.executor.dispatcher import dispatcher

router = APIRouter(prefix="/api/v1/executor", tags=["Action Executor & Resilience"])


class DispatchRequest(BaseModel):
    action: str = Field(..., description="Allowlisted action name to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Action payload parameters")
    session_id: str = Field(default="SESS-LOCAL-001", description="Unique session ID")
    ip_hash: str = Field(default="ip_hash_local", description="Anonymized IP hash")
    is_retry: bool = Field(default=False, description="Flag indicating if request is a retry")


class CircuitTripRequest(BaseModel):
    reason: str = Field(default="Manual circuit trip requested via API endpoint", description="Reason for tripping circuit")


@router.post("/dispatch")
def dispatch_action(req: DispatchRequest = Body(...), response: Response = None) -> Dict[str, Any]:
    """
    Dispatch an action through 3-tier validation (Allowlist -> Kavach Security Verdict -> Circuit Breaker State).
    Automatically routes to Digital Twin Fallback if circuit breaker is OPEN.
    """
    res = dispatcher.dispatch(
        action=req.action,
        payload=req.payload,
        session_id=req.session_id,
        ip_hash=req.ip_hash,
        is_retry=req.is_retry,
    )
    if response is not None and res.get("status"):
        response.status_code = res["status"]
    return res


@router.get("/circuit-status")
def get_circuit_status() -> Dict[str, Any]:
    """
    Retrieve current status, metrics, and recovery probe intervals for the 3-state CircuitBreaker.
    """
    status_data = dispatcher.circuit_breaker.get_status()
    return {
        "status": 200,
        "service": "NIRANTAR Resilient Circuit Breaker Core",
        "circuit": status_data,
        **status_data,
    }


@router.post("/circuit-reset")
def reset_circuit_breaker() -> Dict[str, Any]:
    """
    Manually reset the CircuitBreaker to CLOSED state and clear failure counters.
    """
    dispatcher.circuit_breaker.reset()
    status_data = dispatcher.circuit_breaker.get_status()
    return {
        "status": 200,
        "message": "Circuit breaker successfully reset to CLOSED state.",
        "circuit": status_data,
    }


@router.post("/circuit-trip")
def trip_circuit_breaker(payload: Optional[CircuitTripRequest] = None) -> Dict[str, Any]:
    """
    Manually trip the CircuitBreaker into OPEN state for resilience testing.
    """
    reason = payload.reason if payload else "Manual circuit trip via API"
    dispatcher.circuit_breaker.trip(reason=reason)
    status_data = dispatcher.circuit_breaker.get_status()
    return {
        "status": 200,
        "message": f"Circuit breaker tripped to OPEN state: {reason}",
        "circuit": status_data,
    }


@router.get("/allowlist")
def get_action_allowlist() -> Dict[str, Any]:
    """
    Retrieve the strict allowlist of actions permitted by NIRANTAR Action Executor.
    """
    permitted = dispatcher.allowlist.permitted_actions
    return {
        "status": 200,
        "service": "NIRANTAR Action Allowlist Core",
        "count": len(permitted),
        "allowlist": permitted,
        "permitted_actions": permitted,
    }
