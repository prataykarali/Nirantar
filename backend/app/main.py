"""
NIRANTAR — Central FastAPI Application Gateway
==============================================
Local-First, Provider-Agnostic, API-Light Public Service Resilience Platform.
"""

from pathlib import Path
from typing import Any, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Load local provider credentials before adapters are imported and instantiated.
# Deployment environments may still override these values with real env vars.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from backend.app.core.runtime import twin as router
from backend.app.api.citizen import router as citizen_router
from backend.app.api.predictions import router as predictions_router
from backend.app.api.search import router as search_router
from backend.app.api.prayog import router as prayog_router
from backend.app.api.command_center import router as command_center_router

app = FastAPI(
    title="NIRANTAR Platform API",
    description="Local-First AI-powered Public-Service Resilience & Journey Orchestration Gateway",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(citizen_router)
app.include_router(predictions_router)
app.include_router(search_router)
app.include_router(prayog_router)
app.include_router(command_center_router)


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "NIRANTAR",
        "version": "0.1.0",
        "mode": "local-first",
    }


@app.get("/api/v1/stations")
def get_stations() -> Dict[str, Any]:
    return router.handle_request("GET", "/api/v0/stations")


@app.get("/api/v1/trains/search")
def search_trains(source: str, destination: str) -> Dict[str, Any]:
    return router.handle_request("GET", "/api/v0/trains/search", {"source": source, "destination": destination})


@app.post("/api/v1/availability")
def check_availability(payload: Dict[str, Any]) -> Dict[str, Any]:
    return router.handle_request("POST", "/api/v0/availability", payload)


@app.post("/api/v1/booking/initiate")
def initiate_booking(payload: Dict[str, Any]) -> Dict[str, Any]:
    return router.handle_request("POST", "/api/v0/booking/initiate", payload)


@app.get("/api/v1/telemetry/snapshot")
def get_telemetry() -> Dict[str, Any]:
    raw = router.handle_request("GET", "/api/v0/telemetry/snapshot")
    data = raw.get("data", [])
    if isinstance(data, list) and len(data) > 0:
        total_rps = sum(s.get("requests_per_sec", 0.0) for s in data)
        total_users = sum(s.get("concurrent_users", 0) for s in data)
        avg_cpu = sum(s.get("cpu_percent", 0.0) for s in data) / len(data)
        avg_ram = sum(s.get("ram_percent", 0.0) for s in data) / len(data)
        avg_p50 = sum(s.get("latency_p50_ms", 0.0) for s in data) / len(data)
        max_p99 = max(s.get("latency_p99_ms", 0.0) for s in data)
        avg_err = sum(s.get("error_rate", 0.0) for s in data) / len(data)
        total_queue = sum(s.get("queue_length", 0) for s in data)
        total_tps = sum(s.get("throughput_rps", 0.0) for s in data)
        aggregate = {
            "service_name": "BookingEngine",
            "timestamp": data[0].get("timestamp"),
            "requests_per_sec": round(total_rps, 2),
            "concurrent_users": total_users,
            "cpu_percent": round(avg_cpu, 2),
            "ram_percent": round(avg_ram, 2),
            "network_mbps": 1.2,
            "latency_p50_ms": round(avg_p50, 2),
            "latency_p99_ms": round(max_p99, 2),
            "error_rate": round(avg_err, 4),
            "queue_length": total_queue,
            "throughput_rps": round(total_tps, 2),
        }
        return {"status": 200, "data": aggregate, "services": data}
    return raw


@app.get("/api/v1/graph/topology")
def get_topology() -> Dict[str, Any]:
    return router.handle_request("GET", "/api/v0/graph/topology")


@app.post("/api/v1/graph/simulate-failure")
def simulate_failure(payload: Dict[str, Any]) -> Dict[str, Any]:
    return router.handle_request("POST", "/api/v0/graph/simulate-failure", payload)


@app.post("/api/v1/simulation/scenario")
def set_scenario(payload: Dict[str, Any]) -> Dict[str, Any]:
    return router.handle_request("POST", "/api/v0/simulation/scenario", payload)


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            # Receive client ping or command
            data = await websocket.receive_text()
            # Stream latest telemetry snapshot
            snapshot = router.handle_request("GET", "/api/v0/telemetry/snapshot")
            await websocket.send_json(snapshot)
    except WebSocketDisconnect:
        pass
