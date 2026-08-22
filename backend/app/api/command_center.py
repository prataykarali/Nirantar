"""Operator Command Center API."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from backend.app.services.command_center.assembler import CommandCenterService

router = APIRouter(prefix="/api/v1/command-center", tags=["Command Center"])
service = CommandCenterService()


class ScenarioRequest(BaseModel):
    scenario: str = "NORMAL"
    population: Optional[int] = Field(default=120, ge=1, le=10000)


@router.get("/snapshot")
def get_snapshot() -> Dict[str, Any]:
    return {"status": 200, "snapshot": service.snapshot().model_dump(mode="json")}


@router.post("/scenario")
def run_operator_scenario(payload: ScenarioRequest = Body(...)) -> Dict[str, Any]:
    snap = service.run_scenario(payload.scenario, population=payload.population or 120)
    return {"status": 200, "snapshot": snap.model_dump(mode="json")}
