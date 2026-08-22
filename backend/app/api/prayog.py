"""
PRAYOG API — Synthetic Citizen Simulation, Load Balancing, CDN Cache & Chaos Suite endpoints.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from backend.app.core.runtime import prayog as engine
from m6_prayog.chaos_suite import chaos_suite
from m6_prayog.metrics import telemetry_tracker
from simulation.personas.catalog import DEFAULT_MIX_10K, DEMOGRAPHIC_MIX_10K, PERSONA_SPECS
from simulation.scenarios.catalog import SCENARIOS

router = APIRouter(prefix="/api/v1/prayog", tags=["PRAYOG Simulation"])


class PrayogRunRequest(BaseModel):
    scenario: str = "NORMAL"
    population: Optional[int] = Field(default=None, ge=1, le=10000)
    persist_bookings: bool = False
    use_demographic_mix: bool = False


@router.get("/scenarios")
def list_scenarios() -> Dict[str, Any]:
    """List 6 Stress Scenarios (A through F)."""
    return {"status": 200, "scenarios": chaos_suite.list_scenarios()}


@router.get("/personas")
def list_personas() -> Dict[str, Any]:
    """Get Virtual Citizen persona distributions (Demographic 10K & Default Mix)."""
    specs_summary = {}
    for kind, spec in PERSONA_SPECS.items():
        specs_summary[kind.value] = {
            "intent": str(spec.get("intent")),
            "think_time_range": list(spec.get("think", (1.0, 3.0))),
            "session_duration_range": list(spec.get("session", (60.0, 120.0))),
            "device": str(spec.get("device")),
            "steps": [s.value for s in spec.get("journey", [])],
        }

    return {
        "status": 200,
        "demographic_mix_10k": {
            "RURAL": 3500,  # 35%
            "TATKAL_RUSH": 3000,  # 30%
            "COMMUTER": 2000,  # 20%
            "BOT_SCALPER": 1500,  # 15%
        },
        "default_mix_10k": {k.value: v for k, v in DEFAULT_MIX_10K.items()},
        "mix_10k": {k.value: v for k, v in DEFAULT_MIX_10K.items()},
        "persona_specs": specs_summary,
        "fields": [
            "user_id",
            "intent",
            "language",
            "device",
            "arrival_time",
            "think_time",
            "session_duration",
            "journey",
            "ip_hash",
        ],
    }


@router.post("/run-scenario")
def run_scenario_endpoint(payload: PrayogRunRequest = Body(...)) -> Dict[str, Any]:
    """Run a stress scenario (A through F) with load balancing and telemetry tracking."""
    key = payload.scenario.strip().upper()
    summary = chaos_suite.run_scenario(
        scenario_key=key,
        population=payload.population,
        persist_bookings=payload.persist_bookings,
        engine=engine,
    )
    metrics = telemetry_tracker.get_snapshot().model_dump()
    load_balance_status = engine.get_load_balance_status()

    return {
        "status": 200,
        "run": summary.model_dump(mode="json"),
        "telemetry": metrics,
        "load_balance": load_balance_status,
    }


@router.post("/run")
def run_legacy(payload: PrayogRunRequest = Body(...)) -> Dict[str, Any]:
    """Legacy alias endpoint for running simulation scenarios."""
    return run_scenario_endpoint(payload)


@router.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Get telemetry metrics (queue depth, p95 latency, throughput RPS, bot mitigation rate)."""
    snapshot = telemetry_tracker.get_snapshot().model_dump()
    return {
        "status": 200,
        "metrics": snapshot,
        "queue_depth": snapshot["queue_depth"],
        "p95_latency_ms": snapshot["p95_latency_ms"],
        "throughput_rps": snapshot["throughput_rps"],
        "bot_mitigation_rate": snapshot["bot_mitigation_rate"],
        "legit_success_rate": snapshot["legit_success_rate"],
    }


@router.get("/load-balance-status")
def get_load_balance_status() -> Dict[str, Any]:
    """Get load balancing status: Dynamic Admission Token Bucket, Edge CDN Caching Headers & Dhara Surge Shedding."""
    status = engine.get_load_balance_status()
    return {"status": 200, "data": status}


@router.post("/tatkal-surge")
def trigger_tatkal_surge(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Trigger or deactivate 10:00 AM Tatkal Rush Dhara Surge Shedding."""
    active = bool(payload.get("active", True))
    result = engine.trigger_tatkal_surge(active)
    return {"status": 200, "result": result}


@router.post("/stop")
def stop_simulation() -> Dict[str, Any]:
    """Halt running simulation and reset token bucket & telemetry state."""
    res = engine.stop()
    return {"status": 200, "stop_result": res}


@router.get("/last")
def last_run() -> Dict[str, Any]:
    """Get summary of the last simulation run."""
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
