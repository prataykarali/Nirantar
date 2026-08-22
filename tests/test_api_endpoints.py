"""
Unit & Integration Tests for NIRANTAR Backend API Endpoints
===========================================================
Tests the pure-Python dispatcher and FastAPI endpoints (when FastAPI is present).
"""

import pytest
from m0_digital_twin.railway_api import DigitalTwinRouter

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
    HAS_FASTAPI = True
except (ImportError, Exception):
    HAS_FASTAPI = False


def test_router_pure_python_stations() -> None:
    router = DigitalTwinRouter()
    res = router.handle_request("GET", "/api/v0/stations")
    assert res["status"] == 200
    assert len(res["data"]) >= 10


def test_router_pure_python_train_search() -> None:
    router = DigitalTwinRouter()
    res = router.handle_request("GET", "/api/v0/trains/search", {"source": "HWH", "destination": "NDLS"})
    assert res["status"] == 200
    assert len(res["data"]) >= 1


def test_router_pure_python_telemetry() -> None:
    router = DigitalTwinRouter()
    res = router.handle_request("GET", "/api/v0/telemetry/snapshot")
    assert res["status"] == 200
    assert len(res["data"]) == 6


@pytest.mark.skipif(not HAS_FASTAPI, reason="fastapi not installed in current environment")
def test_fastapi_endpoints() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
