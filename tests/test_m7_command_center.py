"""Module 7 — Command Center operator snapshot."""

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.api.command_center import service as cc_service
from backend.app.core.runtime import twin


client = TestClient(app)


def test_snapshot_has_control_loop_fields() -> None:
    res = client.get("/api/v1/command-center/snapshot")
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    assert {"live", "forecast", "security", "nodes", "actions", "timeline"} <= set(snap)
    live = snap["live"]
    for key in ("concurrent_users", "requests_per_sec", "cpu_percent", "latency_ms", "error_rate_pct"):
        assert key in live
    forecast = snap["forecast"]
    for key in ("current_users", "plus_5_min_users", "plus_10_min_users", "safe_capacity_users"):
        assert key in forecast
    security = snap["security"]
    for key in ("legitimate", "suspicious", "blocked", "throttled"):
        assert key in security
    labels = {n["label"] for n in snap["nodes"]}
    assert labels == {"AUTH", "BOOKING", "DB", "PAYMENT"}
    assert len(snap["actions"]) == 5
    assert snap["timeline"]


def test_infra_scenario_marks_inventory_bottleneck() -> None:
    twin.graph.nodes["SeatInventoryDB"].health = 1.0
    res = client.post(
        "/api/v1/command-center/scenario",
        json={"scenario": "F", "population": 80},
    )
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    db = next(n for n in snap["nodes"] if n["label"] == "DB")
    assert db["status"] in {"degraded", "down"}
    assert "Inventory DB" in snap["bottleneck_detail"]
    protect = next(a for a in snap["actions"] if a["id"] == "protect_db")
    assert protect["active"] is True
    labels = [e["label"] for e in snap["timeline"]]
    assert any("queue" in lab.lower() or "Overload" in lab or "spike" in lab.lower() for lab in labels)


def test_normal_scenario_keeps_auth_and_booking_up() -> None:
    res = client.post(
        "/api/v1/command-center/scenario",
        json={"scenario": "A", "population": 60},
    )
    assert res.status_code == 200
    snap = res.json()["snapshot"]
    by_label = {n["label"]: n for n in snap["nodes"]}
    assert by_label["AUTH"]["status"] == "healthy"
    assert by_label["BOOKING"]["status"] == "healthy"
    assert snap["security"]["legitimate"] >= snap["security"]["suspicious"]


def test_snapshot_poll_does_not_fill_admission_queue() -> None:
    from backend.app.core.runtime import prayog

    before = prayog.dhara.queue.depth()
    cc_service.snapshot()
    cc_service.snapshot()
    assert prayog.dhara.queue.depth() == before
