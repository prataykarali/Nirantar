"""
NIRANTAR Module 0 — Mock Railway REST API & Request Router
==========================================================
Clean REST interface exposing the Digital Twin services to M1 (Civic Journey Intake),
M2 (Predictive Intelligence), M3 (Security), and M4 (Resilience).
"""

import json
import random
import time
from typing import Any, Dict, List, Optional
from .database import DigitalTwinDatabase, get_db
from .dependency_graph import ServiceDependencyGraph, default_service_graph
from .mock_services import (
    AuthService,
    CitizenProfileService,
    SearchService,
    AvailabilityService,
    BookingService,
    PaymentService,
)
from .models import BookingRequest, Passenger, PaymentMethod
from .telemetry_emitter import TelemetryEmitter, SimulationScenario


class DigitalTwinRouter:
    """Pure Python request dispatcher for testing & headless environments."""

    def __init__(
        self,
        db: Optional[DigitalTwinDatabase] = None,
        graph: Optional[ServiceDependencyGraph] = None,
        emitter: Optional[TelemetryEmitter] = None,
    ) -> None:
        self.db = db or get_db()
        self.graph = graph or default_service_graph()
        self.emitter = emitter or TelemetryEmitter(self.db)
        self.auth = AuthService(self.db)
        self.profile = CitizenProfileService(self.db)
        self.search = SearchService(self.db)
        self.availability = AvailabilityService(self.db)
        self.payment = PaymentService(self.db)
        self.booking = BookingService(self.db, self.payment)
        self.chaos: Any = None

    def handle_request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch HTTP-like requests to microservices."""
        body = body or {}
        method = method.upper()
        injected = self._apply_chaos(path)
        if injected is not None:
            return injected

        if path == "/api/v0/stations" and method == "GET":
            return {"status": 200, "data": self.search.list_stations()}

        if path == "/api/v0/trains/search" and method == "GET":
            src = body.get("source", "")
            dst = body.get("destination", "")
            return {"status": 200, "data": self.search.search_routes(src, dst)}

        if path == "/api/v0/availability" and method == "POST":
            res = self.availability.check_availability(
                body.get("train_no", ""),
                body.get("travel_date", ""),
                body.get("class_type", "SL"),
                body.get("quota", "GN"),
            )
            return {"status": 200, "data": res}

        if path == "/api/v0/booking/initiate" and method == "POST":
            passengers = [
                Passenger(
                    name_masked=p.get("name", "P****"),
                    age=p.get("age", 30),
                    gender=p.get("gender", "M"),
                    berth_preference=p.get("berth_preference", "LOWER"),
                )
                for p in body.get("passengers", [{"name": "P****"}])
            ]
            req = BookingRequest(
                citizen_id=body.get("citizen_id", "CIT-001"),
                train_no=body.get("train_no", "12301"),
                travel_date=body.get("travel_date", "2026-08-22"),
                class_type=body.get("class_type", "SL"),
                quota=body.get("quota", "GN"),
                source_station=body.get("source", "HWH"),
                destination_station=body.get("destination", "NDLS"),
                passengers=passengers,
            )
            record, txn = self.booking.initiate_booking(req)
            return {
                "status": 200 if record.status.value == "CONFIRMED" else 400,
                "data": {
                    "booking_id": record.booking_id,
                    "pnr": record.pnr,
                    "status": record.status.value,
                    "total_amount_inr": record.total_amount_inr,
                    "payment_transaction_id": txn.transaction_id if txn else None,
                },
            }

        if path == "/api/v0/telemetry/snapshot" and method == "GET":
            metrics = self.emitter.emit_snapshot()
            return {"status": 200, "data": [m.__dict__ for m in metrics]}

        if path == "/api/v0/graph/topology" and method == "GET":
            return {
                "status": 200,
                "data": {
                    "nodes": list(self.graph.nodes.keys()),
                    "dependencies": {k: list(v) for k, v in self.graph.dependencies.items()},
                    "mermaid": self.graph.to_mermaid(),
                },
            }

        if path == "/api/v0/graph/simulate-failure" and method == "POST":
            target = body.get("failed_service", "")
            return {"status": 200, "data": self.graph.simulate_failure(target)}

        if path == "/api/v0/simulation/scenario" and method == "POST":
            scen_name = body.get("scenario", "NORMAL_DAYTIME")
            try:
                scen = SimulationScenario(scen_name)
                self.emitter.set_scenario(scen)
                return {"status": 200, "data": {"active_scenario": scen.value}}
            except ValueError:
                return {"status": 400, "error": f"Invalid scenario: {scen_name}"}

        return {"status": 404, "error": f"Endpoint not found: {method} {path}"}

    def _apply_chaos(self, path: str) -> Optional[Dict[str, Any]]:
        """Lab-only fault injection. Inactive unless PRAYOG attached a runtime."""
        chaos = self.chaos
        if chaos is None or not getattr(chaos, "active", False):
            return None
        outage = getattr(chaos, "outage_service", "") or ""
        outage_paths = {
            "SeatInventoryDB": ("/api/v0/availability", "/api/v0/booking/initiate"),
            "PaymentGateway": ("/api/v0/booking/initiate",),
            "AuthService": ("/api/v0/booking/initiate",),
            "SearchService": ("/api/v0/trains/search",),
        }
        if outage and path in outage_paths.get(outage, ()):
            return {"status": 503, "error": f"injected_outage:{outage}"}
        if getattr(chaos, "sleep", False):
            delay_ms = float(getattr(chaos, "network_latency_ms", 0.0) or 0.0)
            if path in ("/api/v0/availability", "/api/v0/booking/initiate"):
                delay_ms += float(getattr(chaos, "db_latency_ms", 0.0) or 0.0)
            if delay_ms > 0:
                time.sleep(delay_ms / 1000.0)
        rate = float(getattr(chaos, "api_error_rate", 0.0) or 0.0)
        if rate > 0 and path in ("/api/v0/availability", "/api/v0/booking/initiate"):
            if random.random() < rate:
                return {"status": 503, "error": "injected_api_failure"}
        return None


def create_digital_twin_app() -> Any:
    """FastAPI app factory if FastAPI is available, else returns DigitalTwinRouter."""
    try:
        from fastapi import FastAPI, Body, Query
        app = FastAPI(title="NIRANTAR Digital Twin API", version="1.0.0")
        router = DigitalTwinRouter()

        @app.get("/api/v0/stations")
        def get_stations() -> Dict[str, Any]:
            return router.handle_request("GET", "/api/v0/stations")

        @app.get("/api/v0/trains/search")
        def search_trains(source: str = Query(...), destination: str = Query(...)) -> Dict[str, Any]:
            return router.handle_request("GET", "/api/v0/trains/search", {"source": source, "destination": destination})

        @app.post("/api/v0/availability")
        def check_avail(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
            return router.handle_request("POST", "/api/v0/availability", payload)

        @app.post("/api/v0/booking/initiate")
        def book_seat(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
            return router.handle_request("POST", "/api/v0/booking/initiate", payload)

        @app.get("/api/v0/telemetry/snapshot")
        def telemetry_snapshot() -> Dict[str, Any]:
            return router.handle_request("GET", "/api/v0/telemetry/snapshot")

        @app.get("/api/v0/graph/topology")
        def graph_topology() -> Dict[str, Any]:
            return router.handle_request("GET", "/api/v0/graph/topology")

        @app.post("/api/v0/graph/simulate-failure")
        def graph_failure(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
            return router.handle_request("POST", "/api/v0/graph/simulate-failure", payload)

        @app.post("/api/v0/simulation/scenario")
        def set_scenario(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
            return router.handle_request("POST", "/api/v0/simulation/scenario", payload)

        return app
    except ImportError:
        return DigitalTwinRouter()
