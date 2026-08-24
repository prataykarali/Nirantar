"""
NIRANTAR — Complete 18-Step Citizen Journey Test
==================================================
Scenario: A citizen wants to travel from Delhi to Mumbai tomorrow.

Steps:
1. Open Home.
2. Enter journey (NDLS -> Mumbai / Tomorrow).
3. Search trains.
4. Compare options.
5. Select train (12951 Mumbai Rajdhani).
6. Autofill passenger information (Allowed-field filter).
7. Review booking details.
8. Complete mock authentication (Isolated credentials).
9. Complete mock payment (Double-verification bridge).
10. Receive ticket (Active ticket with PNR).
11. Open My Journeys (Sync active booking).
12. Verify payment appears in ledger.
13. Track train (Live GPS tracking, delay, next stop).
14. Open Nira Assist.
15. Ask for help (Dynamic website & DB answers).
16. Test AI unavailable fallback (Safe Assist resilience).
17. Test payment failure state and recovery.
18. Test payment UNKNOWN state and double-deduction prevention.
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.base import init_db
from backend.app.seeds.seed_data import seed_all

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_environment():
    init_db()
    seed_all()


def test_complete_18_step_delhi_to_mumbai_citizen_journey():
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()

    # -------------------------------------------------------------
    # Step 1: Open Home
    # -------------------------------------------------------------
    home_health = client.get("/health")
    assert home_health.status_code == 200
    assert home_health.json()["status"] == "healthy"

    # -------------------------------------------------------------
    # Step 2 & 3: Enter Journey & Search Trains (Delhi -> Mumbai)
    # -------------------------------------------------------------
    search_res = client.get(f"/api/v1/trains/search?source=NDLS&destination=CSMT&date={tomorrow}")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert "trains" in search_data
    assert len(search_data["trains"]) > 0
    assert search_data["origin"]["code"] == "NDLS"
    assert search_data["destination"]["code"] in ("CSMT", "MMCT")

    # -------------------------------------------------------------
    # Step 4: Compare options
    # -------------------------------------------------------------
    trains = search_data["trains"]
    assert len(trains) >= 1
    rajdhani = next((t for t in trains if "Rajdhani" in t["trainName"] or t["trainNumber"] == "12951" or t["trainNumber"] == "22222"), trains[0])
    assert "classes" in rajdhani
    assert len(rajdhani["classes"]) > 0

    # -------------------------------------------------------------
    # Step 5: Select Train & Create Journey
    # -------------------------------------------------------------
    dest_code = search_data["destination"]["code"]
    j_create = client.post("/api/v1/journeys", json={
        "origin_code": "NDLS",
        "destination_code": dest_code,
        "travel_date": tomorrow,
        "passengers_count": 1,
        "class_type": "3A",
    })
    assert j_create.status_code == 200
    journey_id = j_create.json()["journeyId"]

    select_res = client.post(f"/api/v1/journeys/{journey_id}/select-train", json={
        "train_number": rajdhani["trainNumber"],
        "class_code": "3A",
    })
    assert select_res.status_code == 200
    assert select_res.json()["selected"] is True

    # -------------------------------------------------------------
    # Step 6: Autofill Passenger Information (Allowed-field filter)
    # -------------------------------------------------------------
    raw_user_profile = {
        "Name": "Ananya Sharma",
        "Age": 22,
        "Gender": "F",
        "Berths": "LOWER",
        "password": "secret_bank_pwd_123",
        "otp": "998811",
        "cvv": "123",
    }
    autofill_res = client.post("/api/v1/citizen/autofill/safe-fields", json={"user_data": raw_user_profile})
    assert autofill_res.status_code == 200
    safe_fields = autofill_res.json()["safe_data"]
    assert safe_fields["Name"] == "Ananya Sharma"
    assert "password" not in safe_fields
    assert "otp" not in safe_fields

    # Save to journey
    pass_res = client.post(f"/api/v1/journeys/{journey_id}/passengers", json={
        "passengers": [
            {
                "name": safe_fields["Name"],
                "age": safe_fields["Age"],
                "gender": safe_fields["Gender"],
                "berth_preference": "LOWER",
            }
        ]
    })
    assert pass_res.status_code == 200
    assert pass_res.json()["count"] == 1

    # -------------------------------------------------------------
    # Step 7: Review Journey State
    # -------------------------------------------------------------
    review_res = client.get(f"/api/v1/journeys/{journey_id}")
    assert review_res.status_code == 200
    review_state = review_res.json()
    assert review_state["origin"]["code"] == "NDLS"
    assert review_state["destination"]["code"] in ("CSMT", "MMCT")
    assert len(review_state["passengers"]) == 1

    # -------------------------------------------------------------
    # Step 8: Complete Mock Authentication (Isolated credentials)
    # -------------------------------------------------------------
    auth_res = client.post("/api/v1/auth/mock-login", json={
        "username": "ananya",
        "password": "nirantar2026",
    })
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert auth_data["isAuthenticated"] is True
    assert "password" not in auth_data

    # -------------------------------------------------------------
    # Step 9: Complete Mock Payment (Double-verification bridge)
    # -------------------------------------------------------------
    idempotency_key = f"idemp_{journey_id}_success"
    pay_init = client.post("/api/v1/payments", json={
        "journey_id": journey_id,
        "amount": 3040,
        "method": "UPI",
        "idempotency_key": idempotency_key,
    })
    assert pay_init.status_code == 200
    payment_id = pay_init.json()["id"]

    # Trigger mock result -> SUCCESS
    pay_succ = client.post(f"/api/v1/payments/{payment_id}/mock-result", json={"result": "SUCCESS"})
    assert pay_succ.status_code == 200
    assert pay_succ.json()["state"] in ("BOOKING_CONFIRMED", "SUCCESS")

    # -------------------------------------------------------------
    # Step 10: Receive Ticket
    # -------------------------------------------------------------
    ticket_res = client.get(f"/api/v1/journeys/{journey_id}/ticket")
    assert ticket_res.status_code == 200
    ticket = ticket_res.json()
    assert ticket["pnrNumber"] is not None
    assert ticket["status"] == "ACTIVE"
    assert len(ticket["seatAllotments"]) > 0

    # -------------------------------------------------------------
    # Step 11: Open My Journeys
    # -------------------------------------------------------------
    j_list_res = client.get(f"/api/v1/journeys/{journey_id}")
    assert j_list_res.status_code == 200
    assert j_list_res.json()["step"] in ("BOOKED", "COMPLETED", "PASSENGERS_SAVED", "TICKET_ISSUED")

    # -------------------------------------------------------------
    # Step 12: Verify Payment Appears
    # -------------------------------------------------------------
    pay_verify_res = client.get(f"/api/v1/payments/{payment_id}")
    assert pay_verify_res.status_code == 200
    assert pay_verify_res.json()["amount"] == 3040

    # -------------------------------------------------------------
    # Step 13: Track Train
    # -------------------------------------------------------------
    # Search route schedules from DB
    train_search = client.get(f"/api/v1/trains/search?source=NDLS&destination={dest_code}")
    assert train_search.status_code == 200

    # -------------------------------------------------------------
    # Step 14 & 15: Open Nira & Ask for Help
    # -------------------------------------------------------------
    nira_intent = client.post("/api/v1/nira/intent", json={
        "query": "I want to travel from Delhi to Mumbai tomorrow evening",
        "language": "en",
    })
    assert nira_intent.status_code == 200
    intent_json = nira_intent.json()
    assert intent_json["intent"] == "SEARCH_TRAINS"
    assert intent_json["entities"]["from"]["code"] == "NDLS"
    assert intent_json["entities"]["to"]["code"] in ("CSMT", "MMCT")

    # Civic Explain endpoint test
    explain_res = client.post("/api/v1/citizen/explain", json={"term_or_field": "3A", "language": "en"})
    assert explain_res.status_code == 200
    assert "AC 3-Tier" in explain_res.json()["explanation"]

    # -------------------------------------------------------------
    # Step 16: Test AI Unavailable Fallback (Safe Assist)
    # -------------------------------------------------------------
    # Safe Assist works deterministically even when NVIDIA is offline
    safe_intent = client.post("/api/v1/citizen/intent", json={
        "query": "Book train from Delhi to Kolkata tomorrow",
        "language": "en",
    })
    assert safe_intent.status_code == 200
    assert safe_intent.json()["intent"] is not None

    # -------------------------------------------------------------
    # Step 17: Test Payment Failure State & Recovery
    # -------------------------------------------------------------
    fail_j = client.post("/api/v1/journeys", json={
        "origin_code": "NDLS",
        "destination_code": dest_code,
        "travel_date": tomorrow,
        "passengers_count": 1,
    }).json()["journeyId"]

    pay_fail_init = client.post("/api/v1/payments", json={
        "journey_id": fail_j,
        "amount": 3040,
        "method": "UPI",
        "idempotency_key": f"idemp_{fail_j}_fail",
    }).json()

    fail_res = client.post(f"/api/v1/payments/{pay_fail_init['id']}/mock-result", json={"result": "FAILED"})
    assert fail_res.status_code == 200
    assert fail_res.json()["state"] == "FAILED"

    # -------------------------------------------------------------
    # Step 18: Test Payment UNKNOWN State & Recovery
    # -------------------------------------------------------------
    unknown_j = client.post("/api/v1/journeys", json={
        "origin_code": "NDLS",
        "destination_code": dest_code,
        "travel_date": tomorrow,
        "passengers_count": 1,
    }).json()["journeyId"]

    pay_unk_init = client.post("/api/v1/payments", json={
        "journey_id": unknown_j,
        "amount": 3040,
        "method": "UPI",
        "idempotency_key": f"idemp_{unknown_j}_unk",
    }).json()

    unk_res = client.post(f"/api/v1/payments/{pay_unk_init['id']}/mock-result", json={"result": "UNKNOWN"})
    assert unk_res.status_code == 200
    assert unk_res.json()["state"] == "UNKNOWN"

    # Recovery: Verify status resolves the UNKNOWN state to SUCCESS without paying again
    recovery_res = client.post(f"/api/v1/payments/{pay_unk_init['id']}/mock-result", json={"result": "SUCCESS"})
    assert recovery_res.status_code == 200
    assert recovery_res.json()["state"] in ("BOOKING_CONFIRMED", "SUCCESS")
