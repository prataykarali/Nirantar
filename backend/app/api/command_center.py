"""Operator Command Center API & Dhara Self-Healing Control Endpoint Router."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Query
from pydantic import BaseModel, Field

from backend.app.services.command_center.orchestrator import CommandCenterOrchestrator
from contracts.command_center import (
    CircuitOverrideRequest,
    CircuitOverrideResponse,
    DharaControlRequest,
    DharaControlResponse,
    SelfHealingLogsResponse,
)

router = APIRouter(prefix="/api/v1/command-center", tags=["Command Center"])
orchestrator = CommandCenterOrchestrator()
# For backward compatibility with existing modules/tests referencing cc_service
service = orchestrator


class ScenarioRequest(BaseModel):
    scenario: str = "NORMAL"
    population: Optional[int] = Field(default=120, ge=1, le=10000)


@router.get("/snapshot")
def get_snapshot() -> Dict[str, Any]:
    """Get aggregated real-time system telemetry and command center snapshot."""
    snap = orchestrator.snapshot()
    return {"status": 200, "snapshot": snap.model_dump(mode="json")}


@router.get("/dhara-control")
def get_dhara_control() -> Dict[str, Any]:
    """Get current Dhara load shedding level, auto-healing state, and active policies."""
    status_data = orchestrator.dhara.get_status()
    return {
        "status": 200,
        "level": status_data.get("level", 0),
        "auto_healing_enabled": status_data.get("auto_healing_enabled", True),
        "manual_override": status_data.get("manual_override", False),
        "circuit_breaker_state": status_data.get("circuit_breaker_state", "CLOSED"),
        "active_policies": status_data.get("active_policies", []),
    }


@router.post("/dhara-control", response_model=DharaControlResponse)
def control_dhara(payload: DharaControlRequest = Body(...)) -> DharaControlResponse:
    """Set Dhara load shedding level (Level 0-3) or toggle auto-healing mode."""
    if payload.auto_healing_enabled is not None:
        orchestrator.dhara.toggle_auto_healing(
            enabled=payload.auto_healing_enabled,
            reason=payload.reason or "Operator toggle",
        )

    if payload.level is not None:
        res = orchestrator.dhara.set_load_shedding_level(
            level=payload.level,
            reason=payload.reason or "Operator requested level change",
            is_manual=True,
        )
        return DharaControlResponse(
            status=200,
            level=res["level"],
            auto_healing_enabled=res["auto_healing_enabled"],
            active_policies=res["active_policies"],
            message=f"Dhara load shedding level set to {res['level']}",
        )

    status_data = orchestrator.dhara.get_status()
    return DharaControlResponse(
        status=200,
        level=status_data["level"],
        auto_healing_enabled=status_data["auto_healing_enabled"],
        active_policies=status_data["active_policies"],
        message="Dhara control settings updated.",
    )


@router.post("/circuit-override", response_model=CircuitOverrideResponse)
def circuit_override(payload: CircuitOverrideRequest = Body(...)) -> CircuitOverrideResponse:
    """Manually trip (OPEN) or reset (CLOSED) the downstream circuit breaker."""
    action = payload.action.strip().upper()
    if action == "TRIP":
        status_data = orchestrator.dhara.trip_circuit(reason=payload.reason)
        return CircuitOverrideResponse(
            status=200,
            circuit_breaker_state=status_data["state"],
            trip_reason=status_data.get("last_trip_reason", payload.reason),
            message="Circuit breaker manually tripped to OPEN.",
        )
    elif action == "RESET":
        status_data = orchestrator.dhara.reset_circuit(reason=payload.reason)
        return CircuitOverrideResponse(
            status=200,
            circuit_breaker_state=status_data["state"],
            trip_reason=status_data.get("last_trip_reason", payload.reason),
            message="Circuit breaker manually reset to CLOSED.",
        )
    else:
        return CircuitOverrideResponse(
            status=400,
            circuit_breaker_state=orchestrator.dhara.circuit_breaker.state.value,
            trip_reason="Invalid action",
            message="Invalid action specified. Must be 'TRIP' or 'RESET'.",
        )


@router.get("/self-healing-logs", response_model=SelfHealingLogsResponse)
def get_self_healing_logs(limit: int = Query(default=50, ge=1, le=500)) -> SelfHealingLogsResponse:
    """Fetch recent self-healing engine audit logs."""
    logs = orchestrator.dhara.get_logs(limit=limit)
    return SelfHealingLogsResponse(
        status=200,
        count=len(logs),
        logs=logs,
    )


@router.post("/scenario")
def run_operator_scenario(payload: ScenarioRequest = Body(...)) -> Dict[str, Any]:
    """Run simulated load scenario (for Prayog operator testing)."""
    snap = orchestrator.run_scenario(payload.scenario, population=payload.population or 120)
    return {"status": 200, "snapshot": snap.model_dump(mode="json")}
