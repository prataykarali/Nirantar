"""
Unit & Integration Tests for NIRANTAR Module 0 — Digital Twin Environment
========================================================================
Validates simulated microservices, synthetic database, service dependency graph,
real-time telemetry generation, and Zero-PII integrity.
"""

import pytest
from datetime import datetime, timedelta, timezone
from m0_digital_twin.models import (
    BookingRequest,
    Passenger,
    BookingStatus,
    PaymentStatus,
    ThreatLevel,
)
from m0_digital_twin.database import DigitalTwinDatabase
from m0_digital_twin.mock_services import (
    AuthService,
    CitizenProfileService,
    SearchService,
    AvailabilityService,
    BookingService,
    PaymentService,
    NotificationService,
)
from m0_digital_twin.dependency_graph import default_service_graph
from m0_digital_twin.telemetry_emitter import TelemetryEmitter, SimulationScenario
from m0_digital_twin.railway_api import DigitalTwinRouter


@pytest.fixture
def db() -> DigitalTwinDatabase:
    """Fresh in-memory synthetic database fixture."""
    return DigitalTwinDatabase(db_path=":memory:")


def test_station_listing(db: DigitalTwinDatabase) -> None:
    search = SearchService(db)
    stations = search.list_stations()
    assert len(stations) >= 10
    codes = {s["code"] for s in stations}
    assert "NDLS" in codes
    assert "HWH" in codes
    assert "BCT" in codes


def test_train_search(db: DigitalTwinDatabase) -> None:
    search = SearchService(db)
    trains = search.search_routes("HWH", "NDLS")
    assert len(trains) >= 1
    assert any(t["train_no"] == "12301" for t in trains)


def test_availability_check(db: DigitalTwinDatabase) -> None:
    avail = AvailabilityService(db)
    travel_date = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    res_gn = avail.check_availability("12301", travel_date, "3A", "GN")
    assert res_gn["available"] is True
    assert res_gn["available_seats"] > 0
    assert res_gn["fare_inr"] > 0

    res_tq = avail.check_availability("12301", travel_date, "3A", "TQ")
    assert res_tq["available"] is True
    assert res_tq["fare_inr"] > res_gn["fare_inr"]  # Tatkal premium


def test_booking_lifecycle_success(db: DigitalTwinDatabase) -> None:
    payment_svc = PaymentService(db)
    payment_svc.failure_rate = 0.0  # Force success for happy path test
    payment_svc.timeout_rate = 0.0

    booking_svc = BookingService(db, payment_svc)
    travel_date = (datetime.now(timezone.utc).date() + timedelta(days=2)).isoformat()

    req = BookingRequest(
        citizen_id="CIT-001",
        train_no="12301",
        travel_date=travel_date,
        class_type="SL",
        quota="GN",
        source_station="HWH",
        destination_station="NDLS",
        passengers=[
            Passenger(name_masked="P*** K****", age=32, gender="M", berth_preference="LOWER"),
            Passenger(name_masked="S*** K****", age=28, gender="F", berth_preference="MIDDLE"),
        ],
    )

    record, txn = booking_svc.initiate_booking(req)
    assert record.status == BookingStatus.CONFIRMED
    assert len(record.pnr) == 10
    assert txn is not None
    assert txn.status == PaymentStatus.SUCCESS
    assert record.total_amount_inr > 0


def test_booking_out_of_stock_fails(db: DigitalTwinDatabase) -> None:
    booking_svc = BookingService(db)
    travel_date = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()

    # Request more seats than capacity (e.g. 500 seats)
    many_passengers = [Passenger(name_masked=f"P{i}***") for i in range(500)]
    req = BookingRequest(
        citizen_id="CIT-001",
        train_no="12301",
        travel_date=travel_date,
        class_type="1A",
        quota="GN",
        source_station="HWH",
        destination_station="NDLS",
        passengers=many_passengers,
    )

    record, txn = booking_svc.initiate_booking(req)
    assert record.status == BookingStatus.FAILED
    assert txn is None


def test_service_graph_dependencies() -> None:
    graph = default_service_graph()

    # Upstream checks
    booking_upstream = graph.get_upstream("BookingEngine", recursive=False)
    assert "AuthService" in booking_upstream
    assert "SeatInventoryDB" in booking_upstream
    assert "PaymentGateway" in booking_upstream

    # Downstream checks (Blast radius)
    inv_downstream = graph.get_downstream("SeatInventoryDB", recursive=True)
    assert "AvailabilityService" in inv_downstream
    assert "BookingEngine" in inv_downstream
    assert "CitizenPortal_M1" in inv_downstream


def test_service_graph_failure_simulation() -> None:
    graph = default_service_graph()
    sim = graph.simulate_failure("SeatInventoryDB")
    assert sim["failed_service"] == "SeatInventoryDB"
    assert "BookingEngine" in sim["affected_downstream"]
    assert "AuthService" in sim["unaffected_services"]
    assert sim["system_health_index"] < 1.0


def test_critical_path_computation() -> None:
    graph = default_service_graph()
    cp = graph.compute_critical_path("BookingEngine")
    assert cp["target_service"] == "BookingEngine"
    assert "BookingEngine" in cp["critical_path"]
    assert cp["estimated_latency_ms"] > 50.0


def test_telemetry_emitter_profiles(db: DigitalTwinDatabase) -> None:
    emitter = TelemetryEmitter(db)

    # Test Idle Scenario
    emitter.set_scenario(SimulationScenario.IDLE)
    snapshot_idle = emitter.emit_snapshot(tick=1)
    assert len(snapshot_idle) == 6
    assert snapshot_idle[0].requests_per_sec < 50.0

    # Test Tatkal Rush Scenario
    emitter.set_scenario(SimulationScenario.TATKAL_RUSH)
    snapshot_tatkal = emitter.emit_snapshot(tick=1)
    assert snapshot_tatkal[0].requests_per_sec > 1000.0
    assert snapshot_tatkal[0].cpu_percent > 80.0


def test_router_dispatch_endpoints(db: DigitalTwinDatabase) -> None:
    router = DigitalTwinRouter(db)

    # 1. Stations
    res = router.handle_request("GET", "/api/v0/stations")
    assert res["status"] == 200
    assert len(res["data"]) >= 10

    # 2. Topology
    res_graph = router.handle_request("GET", "/api/v0/graph/topology")
    assert res_graph["status"] == 200
    assert "BookingEngine" in res_graph["data"]["nodes"]

    # 3. Telemetry snapshot
    res_telemetry = router.handle_request("GET", "/api/v0/telemetry/snapshot")
    assert res_telemetry["status"] == 200
    assert len(res_telemetry["data"]) == 6


def test_zero_pii_integrity(db: DigitalTwinDatabase) -> None:
    """Validate that all synthetic data masks citizen PII."""
    auth_svc = AuthService(db)
    token = auth_svc.create_session("CIT-001")
    assert token.startswith("tok_")

    profile_svc = CitizenProfileService(db)
    profile = profile_svc.get_profile("CIT-001")
    assert "*" in profile["masked_name"]
    assert "****" in profile["phone_masked"]
    assert profile["linked_documents"][0]["doc_id"].startswith("VID-XXXX")
