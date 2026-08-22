"""
PRAYOG API — run synthetic-user scenarios and inspect DHARA verdicts.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from backend.app.core.runtime import prayog as engine
from simulation.personas.catalog import DEFAULT_MIX_10K
from simulation.scenarios.catalog import SCENARIOS

router = APIRouter(prefix="/api/v1/prayog", tags=["PRAYOG Simulation"])


class PrayogRunRequest(BaseModel):
    scenario: str = "NORMAL"
    population: Optional[int] = Field(default=None, ge=1, le=10000)
    persist_bookings: bool = False


@router.get("/scenarios")
def list_scenarios() -> Dict[str, Any]:
    items = []
    for kind, cfg in SCENARIOS.items():
        items.append(
            {
                "kind": kind.value,
                "name": cfg.name,
                "description": cfg.description,
                "virtual_users": cfg.workload.concurrent_virtual_users,
                "persona_mix": cfg.persona_mix,
                "chaos": cfg.chaos.model_dump(),
                "spike_stages": cfg.spike_stages,
            }
        )
    return {"status": 200, "scenarios": items}


@router.get("/personas")
def list_personas() -> Dict[str, Any]:
    return {
        "status": 200,
        "mix_10k": {k.value: v for k, v in DEFAULT_MIX_10K.items()},
        "fields": [
            "user_id",
            "intent",
            "language",
            "device",
            "arrival_time",
            "think_time",
            "session_duration",
            "journey",
        ],
    }


@router.post("/run")
def run_scenario(payload: PrayogRunRequest = Body(...)) -> Dict[str, Any]:
    key = payload.scenario.strip().upper()
    if key in {"D", "SUDDEN_SPIKE"}:
        summary = engine.run_spike(population_cap=payload.population)
    else:
        summary = engine.run(
            payload.scenario,
            population=payload.population,
            persist_bookings=payload.persist_bookings,
        )
    return {"status": 200, "run": summary.model_dump(mode="json")}


@router.get("/last")
def last_run() -> Dict[str, Any]:
    if engine.last_run is None:
        return {"status": 404, "error": "no_prayog_run_yet"}
    return {"status": 200, "run": engine.last_run.model_dump(mode="json")}


@router.post("/chaos")
def inject_chaos(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Attach a lab fault to the shared digital-twin router used by this process."""
    from contracts.simulation import ChaosFailureMode, ChaosInjectionConfig

    mode = payload.get("failure_mode", "NONE")
    cfg = ChaosInjectionConfig(
        target_service=payload.get("target_service", "SeatInventoryDB"),
        failure_mode=ChaosFailureMode(mode),
        injected_latency_ms=float(payload.get("injected_latency_ms", 0.0)),
        forced_error_rate=float(payload.get("forced_error_rate", 0.0)),
    )
    runtime = engine.chaos.apply(cfg, sleep=bool(payload.get("sleep", False)))
    if cfg.failure_mode in {
        ChaosFailureMode.DATABASE_SLOWDOWN,
        ChaosFailureMode.DATABASE_LOCK,
        ChaosFailureMode.SERVICE_UNRESPONSIVE,
    }:
        engine.dhara.mark_inventory_stress(True)
    return {"status": 200, "chaos": engine.chaos.snapshot(), "active": runtime.active}
