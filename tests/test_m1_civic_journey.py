"""
Unit & Integration Tests for NIRANTAR Module 1 — Civic Journey Intelligence (SAATHI)
=====================================================================================
Validates multilingual natural language intent extraction (English, Hindi, Bengali, Tamil),
voice audio adapter, progressive disclosure state machine, top-3 filtering, safe autofill,
explainability, and failure recovery.
"""

import base64
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

from contracts.citizen import CitizenIntent, CitizenSession, IntentType, SafeAutofillPayload
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine, JourneyStage
from backend.app.services.citizen.failure_recovery import FailureRecoveryEngine
from backend.app.main import app


@pytest.fixture
def extractor() -> MultilingualIntentExtractor:
    return MultilingualIntentExtractor()


@pytest.fixture
def journey_engine() -> ProgressiveJourneyEngine:
    return ProgressiveJourneyEngine()


@pytest.fixture
def recovery_engine() -> FailureRecoveryEngine:
    return FailureRecoveryEngine()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_english_intent_extraction(extractor: MultilingualIntentExtractor) -> None:
    query = "I need to go from Sealdah to New Jalpaiguri tomorrow evening in 3A Tatkal"
    intent = extractor.extract_intent(query, language="en")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.quota == "TQ"
    assert intent.class_preference == "3A"
    assert intent.entities.get("travel_time_preference") == "EVENING"
    assert intent.confidence >= 0.90


def test_hindi_intent_extraction(extractor: MultilingualIntentExtractor) -> None:
    query = "मुझे कल शाम सियालदह से न्यू जलपाईगुड़ी जाना है"
    intent = extractor.extract_intent(query, language="hi")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.language == "hi"
    assert intent.entities.get("travel_time_preference") == "EVENING"


def test_bengali_intent_extraction(extractor: MultilingualIntentExtractor) -> None:
    query = "আমার কাল সন্ধ্যায় শিয়ালদহ থেকে নিউ জলপাইগুড়ি যেতে হবে"
    intent = extractor.extract_intent(query, language="bn")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.language == "bn"
    assert intent.entities.get("travel_time_preference") == "EVENING"


def test_tamil_station_aliases(extractor: MultilingualIntentExtractor) -> None:
    query = "I need to book a train from Chennai to Madurai next Friday"
    intent = extractor.extract_intent(query, language="ta")
    assert intent.source_station == "MAS"
    assert intent.destination_station == "MDU"


def test_relative_date_parsing(extractor: MultilingualIntentExtractor) -> None:
    today = datetime.now(timezone.utc).date()

    # Parso
    intent_parso = extractor.extract_intent("Book train from SDAH to NJP parso", language="en")
    assert intent_parso.travel_date == (today + timedelta(days=2)).isoformat()

    # Next Friday
    intent_fri = extractor.extract_intent("Train from HWH to NDLS next Friday", language="en")
    days_fri = (4 - today.weekday()) % 7
    if days_fri <= 0:
        days_fri += 7
    assert intent_fri.travel_date == (today + timedelta(days=days_fri)).isoformat()

    # Agla Somvar
    intent_mon = extractor.extract_intent("Book ticket agla somvar from MAS to TPJ", language="hi")
    days_mon = (0 - today.weekday()) % 7
    if days_mon <= 0:
        days_mon += 7
    assert intent_mon.travel_date == (today + timedelta(days=days_mon)).isoformat()


def test_confidence_calculation(extractor: MultilingualIntentExtractor) -> None:
    intent_full = extractor.extract_intent("Book 3A ticket from SDAH to NJP tomorrow evening", language="en")
    assert intent_full.confidence >= 0.85

    intent_vague = extractor.extract_intent("train tickets", language="en")
    assert intent_vague.confidence < 0.60


def test_voice_interface_pipeline(extractor: MultilingualIntentExtractor) -> None:
    voice_adapter = VoiceInterfaceAdapter(extractor)
    dummy_audio_b64 = base64.b64encode(b"RIFF....WAVEfmt....mock_voice_audio_bytes").decode("utf-8")

    transcript, intent = voice_adapter.process_voice_request(dummy_audio_b64, language_hint="hi")
    assert len(transcript) > 0
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"


def test_voice_decoding_validation() -> None:
    voice_adapter = VoiceInterfaceAdapter()
    invalid_res = voice_adapter.transcribe_audio_base64("not_valid_base64_string!!!")
    assert invalid_res.get("error") is not None
    assert invalid_res["confidence"] == 0.0

    empty_res = voice_adapter.transcribe_audio_base64("")
    assert empty_res.get("error") is not None


def test_safe_autofill_filtering(journey_engine: ProgressiveJourneyEngine) -> None:
    user_raw_data = {
        "Name": "Rahul Sharma",
        "Age": 29,
        "Gender": "M",
        "Quota": "GN",
        "password": "my_secret_password",
        "otp": "123456",
        "cvv": "999",
        "pin": "4321",
    }
    autofill: SafeAutofillPayload = journey_engine.get_safe_autofill_data(user_raw_data)
    assert "password" not in autofill.safe_data
    assert "otp" not in autofill.safe_data
    assert "cvv" not in autofill.safe_data
    assert "pin" not in autofill.safe_data
    assert "password" in autofill.filtered_out_fields or "password" in [f.lower() for f in autofill.filtered_out_fields]
    assert autofill.safe_data["Name"] == "Rahul Sharma"
    assert autofill.safe_data["Age"] == 29


def test_explainable_top_3_ranking(journey_engine: ProgressiveJourneyEngine) -> None:
    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date=(datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat(),
        class_preference="3A",
    )
    session = CitizenSession()
    res = journey_engine.advance_journey(intent, session, JourneyStage.CONFIRM, {"confirmed": True})
    top_options = res.payload.get("top_options", [])
    assert len(top_options) > 0
    assert "ranking_justification" in top_options[0]
    assert "Rank #1" in top_options[0]["ranking_justification"]


def test_failure_recovery_new_handlers(recovery_engine: FailureRecoveryEngine) -> None:
    # PAYMENT_UNKNOWN
    res_unk = recovery_engine.evaluate_failure("PAYMENT_UNKNOWN")
    assert res_unk["error_category"] == "PAYMENT_UNKNOWN"
    assert res_unk["inventory_hold_active"] is True
    assert res_unk["lock_expiry_seconds"] == 300

    # SEAT_HOLD_EXPIRED
    res_exp = recovery_engine.evaluate_failure("SEAT_HOLD_EXPIRED")
    assert res_exp["error_category"] == "SEAT_HOLD_EXPIRED"
    assert res_exp["inventory_hold_active"] is False

    # TOKEN_BUCKET_THROTTLED
    res_thr = recovery_engine.evaluate_failure("TOKEN_BUCKET_THROTTLED")
    assert res_thr["error_category"] == "TOKEN_BUCKET_THROTTLED"
    assert res_thr["can_auto_retry"] is False

    # GATEWAY_TIMEOUT
    res_gtw = recovery_engine.evaluate_failure("GATEWAY_TIMEOUT")
    assert res_gtw["error_category"] == "GATEWAY_TIMEOUT"
    assert res_gtw["inventory_hold_active"] is True


def test_citizen_api_autofill_and_explain_endpoints(client: TestClient) -> None:
    # Endpoint /api/v1/citizen/autofill/safe-fields
    res_autofill = client.post(
        "/api/v1/citizen/autofill/safe-fields",
        json={"user_data": {"Name": "Asha", "password": "123"}},
    )
    assert res_autofill.status_code == 200
    data_autofill = res_autofill.json()
    assert data_autofill["status"] == 200
    assert "allowed_fields" in data_autofill
    assert "password" in data_autofill["filtered_out_fields"]

    # Endpoint /api/v1/citizen/explain
    res_explain = client.post(
        "/api/v1/citizen/explain",
        json={"term_or_field": "quota", "language": "en"},
    )
    assert res_explain.status_code == 200
    data_explain = res_explain.json()
    assert data_explain["status"] == 200
    assert "Quota specifies ticket allocation" in data_explain["explanation"]
