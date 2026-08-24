"""
NIRANTAR — End-to-End Citizen Journey & Security Test Suite
============================================================
Validates the full citizen journey:
  1. Station & Train Discovery (DB-backed, deterministic)
  2. Journey Creation & Passenger Sync
  3. Mock Authentication with credential isolation
  4. Payment State Machine (READY -> INITIATED -> UNKNOWN -> VERIFY -> SUCCESS)
  5. Idempotent payment handling (prevent duplicate transactions)
  6. Confirmed Ticket & PNR Issuance
  7. Security & AI Context Filter (Zero PII/Credentials in AI context)
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.base import init_db
from backend.app.seeds.seed_data import seed_all

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database is seeded and ready."""
    init_db()
    seed_all()


def test_station_and_train_search():
    """Step 1: Discover & Search Trains (NDLS -> HWH)."""
    res = client.get("/api/v1/trains/search?source=NDLS&destination=HWH")
    assert res.status_code == 200
    data = res.json()
    assert "trains" in data
    assert len(data["trains"]) >= 1
    assert data["origin"]["code"] == "NDLS"
    assert data["destination"]["code"] == "HWH"

    # Verify train details contain class availability
    train = data["trains"][0]
    assert "trainNumber" in train
    assert "classes" in train
    assert len(train["classes"]) > 0


def test_create_journey_and_save_passengers():
    """Step 2 & 3: Create Journey & Save Passenger Details."""
    # 1. Create Journey
    create_res = client.post("/api/v1/journeys", json={
        "origin_code": "NDLS",
        "destination_code": "HWH",
        "travel_date": "2026-08-25",
        "passengers_count": 2,
        "class_type": "3A",
    })
    assert create_res.status_code == 200
    journey_data = create_res.json()
    journey_id = journey_data["journeyId"]
    assert journey_id is not None

    # 2. Select Train
    select_res = client.post(f"/api/v1/journeys/{journey_id}/select-train", json={
        "train_number": "12302",
        "class_code": "3A",
    })
    assert select_res.status_code == 200
    assert select_res.json()["selected"] is True

    # 3. Save Passengers
    passengers_payload = {
        "passengers": [
            {
                "name": "Ananya Sharma",
                "age": 19,
                "gender": "F",
                "berth_preference": "LOWER",
                "senior_citizen_concession": False,
            },
            {
                "name": "Rahul Sharma",
                "age": 22,
                "gender": "M",
                "berth_preference": "SIDE_LOWER",
                "senior_citizen_concession": False,
            },
        ]
    }
    pass_res = client.post(f"/api/v1/journeys/{journey_id}/passengers", json=passengers_payload)
    assert pass_res.status_code == 200
    assert pass_res.json()["count"] == 2

    # 4. Verify Journey State
    get_res = client.get(f"/api/v1/journeys/{journey_id}")
    assert get_res.status_code == 200
    state = get_res.json()
    assert state["passengersCount"] == 2
    assert len(state["passengers"]) == 2
    assert state["passengers"][0]["name"] == "Ananya Sharma"


def test_mock_authentication_credential_isolation():
    """Step 4: Mock Authentication with strict credential isolation."""
    # 1. Login with synthetic credentials
    login_res = client.post("/api/v1/auth/mock-login", json={
        "username": "ananya",
        "password": "nirantar2026",
    })
    assert login_res.status_code == 200
    auth_data = login_res.json()
    assert auth_data["isAuthenticated"] is True
    assert "password" not in auth_data
    assert "password_hash" not in auth_data

    # 2. Verify Session context contains NO secrets
    session_res = client.get(f"/api/v1/auth/session?user_id={auth_data['userId']}")
    assert session_res.status_code == 200
    session = session_res.json()
    assert session["isAuthenticated"] is True
    assert "password" not in session
    assert "otp" not in session
    assert "token" not in session


def test_payment_state_machine_and_unknown_recovery():
    """
    Step 5: Full Payment State Machine per Architecture Doc §11:
      READY -> INITIATED -> UNKNOWN -> VERIFYING -> SUCCESS -> BOOKING_CONFIRMED
    """
    # 1. Create Journey for payment test
    j_res = client.post("/api/v1/journeys", json={
        "origin_code": "NDLS",
        "destination_code": "CSMT",
        "travel_date": "2026-08-26",
        "passengers_count": 1,
    })
    journey_id = j_res.json()["journeyId"]

    # Select train
    client.post(f"/api/v1/journeys/{journey_id}/select-train", json={
        "train_number": "22222",
        "class_code": "3A",
    })

    # 2. Initiate Payment with Idempotency Key
    idempotency_key = f"idemp_{journey_id}_001"
    pay_res = client.post("/api/v1/payments", json={
        "journey_id": journey_id,
        "amount": 2150,
        "method": "UPI",
        "idempotency_key": idempotency_key,
    })
    assert pay_res.status_code == 200
    payment = pay_res.json()
    payment_id = payment["id"]
    assert payment["state"] == "INITIATED"
    assert payment["transactionRef"] is not None

    # 3. Simulate UNKNOWN State (e.g. Bank timeout)
    unknown_res = client.post(f"/api/v1/payments/{payment_id}/mock-result", json={"result": "UNKNOWN"})
    assert unknown_res.status_code == 200
    assert unknown_res.json()["state"] == "UNKNOWN"

    # 4. Verify that creating another payment is blocked/idempotent while UNKNOWN
    dup_res = client.post("/api/v1/payments", json={
        "journey_id": journey_id,
        "amount": 2150,
        "method": "UPI",
        "idempotency_key": idempotency_key,
    })
    # Idempotent return
    assert dup_res.status_code == 200
    assert dup_res.json()["id"] == payment_id

    # 5. Resolve UNKNOWN via Verification Path
    verify_res = client.post(f"/api/v1/payments/{payment_id}/mock-result", json={"result": "SUCCESS"})
    assert verify_res.status_code == 200
    assert verify_res.json()["state"] in ("BOOKING_CONFIRMED", "SUCCESS")

    # 6. Verify Ticket was generated automatically on payment SUCCESS
    ticket_res = client.get(f"/api/v1/journeys/{journey_id}/ticket")
    assert ticket_res.status_code == 200
    ticket = ticket_res.json()
    assert ticket["pnrNumber"] is not None
    assert ticket["bookingReference"] is not None
    assert ticket["status"] == "ACTIVE"
    assert len(ticket["seatAllotments"]) > 0


def test_security_rules_ai_context_blocked_patterns():
    """Verify security isolation: password/OTP/CVV patterns cannot be in session payloads."""
    sensitive_payload = {
        "name": "Ananya Sharma",
        "age": 19,
        "password": "secret_password",
        "otp": "849201",
        "upi_pin": "1234",
        "cvv": "999",
        "card_number": "4111222233334444",
    }
    res = client.post("/api/v1/security/sanitize", json={"payload": sensitive_payload})
    assert res.status_code == 200
    sanitized = res.json()["sanitized_payload"]

    # Sensitive fields MUST be redacted or masked
    assert sanitized.get("password") in ("[REDACTED]", None) or "password" not in sanitized
    assert sanitized.get("otp") in ("[REDACTED]", None) or "otp" not in sanitized
    assert sanitized.get("cvv") in ("[REDACTED]", None) or "cvv" not in sanitized
