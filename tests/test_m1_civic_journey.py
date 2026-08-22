"""
Unit & Integration Tests for NIRANTAR Module 1 — Civic Journey Intelligence (SAATHI)
=====================================================================================
Validates multilingual natural language intent extraction (English, Hindi, Bengali),
voice audio adapter, progressive disclosure state machine, top-3 filtering, and failure recovery.
"""

import base64
from datetime import datetime, timedelta, timezone
import pytest
from contracts.citizen import CitizenIntent, CitizenSession, IntentType
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine, JourneyStage
from backend.app.services.citizen.failure_recovery import FailureRecoveryEngine


@pytest.fixture
def extractor() -> MultilingualIntentExtractor:
    return MultilingualIntentExtractor()


@pytest.fixture
def journey_engine() -> ProgressiveJourneyEngine:
    return ProgressiveJourneyEngine()


@pytest.fixture
def recovery_engine() -> FailureRecoveryEngine:
    return FailureRecoveryEngine()


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


def test_voice_interface_pipeline(extractor: MultilingualIntentExtractor) -> None:
    voice_adapter = VoiceInterfaceAdapter(extractor)
    dummy_audio_b64 = base64.b64encode(b"RIFF....WAVEfmt....mock_voice_audio_bytes").decode("utf-8")

    transcript, intent = voice_adapter.process_voice_request(dummy_audio_b64, language_hint="hi")
    assert len(transcript) > 0
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"


def test_progressive_disclosure_missing_origin(journey_engine: ProgressiveJourneyEngine) -> None:
    # Citizen provides only destination
    intent = CitizenIntent(
        intent_type=IntentType.SEARCH_TRAINS,
        source_station=None,
        destination_station="NJP",
        language="en",
    )
    session = CitizenSession()
    response = journey_engine.advance_journey(intent, session, JourneyStage.INTENT)

    assert response.action_required == "PROVIDE_ORIGIN"
    assert "Where are you travelling from?" in response.message


def test_overnight_kolkata_delhi_intent(extractor: MultilingualIntentExtractor) -> None:
    query = "I want to book an overnight train from Kolkata to Delhi tomorrow."
    intent = extractor.extract_intent(query, language="en")
    assert intent.intent_type == IntentType.BOOK_TRAIN
    assert intent.source_station in {"KOAA", "HWH"}
    assert intent.destination_station == "NDLS"
    assert intent.time_preference == "OVERNIGHT"
    assert intent.passenger_count == 1


def test_intent_confirmation_then_search(journey_engine: ProgressiveJourneyEngine) -> None:
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date=tomorrow,
        class_preference="3A",
        quota="GN",
        language="en",
        time_preference="OVERNIGHT",
        passenger_count=1,
        raw_query="I want to book an overnight train from Kolkata to Delhi tomorrow.",
    )
    session = CitizenSession()
    first = journey_engine.advance_journey(intent, session, JourneyStage.INTENT)
    assert first.action_required == "CONFIRM_INTENT"
    assert first.payload["stage"] == JourneyStage.CONFIRM.value
    assert "I understood this as" in first.message
    assert first.payload["confirmation"]["origin_code"] == "HWH"

    second = journey_engine.advance_journey(
        intent, session, JourneyStage.CONFIRM, {"confirmed": True}
    )
    assert second.action_required == "SELECT_TRAIN"
    assert second.payload["stage"] == JourneyStage.SELECT.value
    top_options = second.payload["top_options"]
    assert 1 <= len(top_options) <= 3
    assert "available_seats" in top_options[0]
    assert "fare_inr" in top_options[0]


def test_guided_booking_to_mock_payment(journey_engine: ProgressiveJourneyEngine) -> None:
    journey_engine.payment_svc.failure_rate = 0.0
    journey_engine.payment_svc.timeout_rate = 0.0
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date=tomorrow,
        class_preference="3A",
        language="en",
        passenger_count=1,
    )
    session = CitizenSession()
    listed = journey_engine.advance_journey(intent, session, JourneyStage.CONFIRM, {"confirmed": True})
    train_no = listed.payload["top_options"][0]["train_no"]
    fare = listed.payload["top_options"][0]["fare_inr"]
    asked = journey_engine.advance_journey(
        intent, session, JourneyStage.SELECT, {"train_no": train_no, "fare_inr": fare}
    )
    assert asked.action_required == "PROVIDE_PASSENGERS"
    review = journey_engine.advance_journey(
        intent,
        session,
        JourneyStage.PASSENGER,
        {"train_no": train_no, "fare_inr": fare, "passengers": [{"name": "Asha Kumar", "age": 34}]},
    )
    assert review.action_required == "REVIEW_CONFIRM"
    paid = journey_engine.advance_journey(
        intent,
        session,
        JourneyStage.PAY,
        {"pay": True, "train_no": train_no, "fare_inr": fare, "passengers": [{"name": "Asha Kumar", "age": 34}]},
    )
    assert paid.action_required == "BOOKING_CONFIRMED"
    assert paid.payload["pnr"]
    assert paid.payload["status"] == "CONFIRMED"


def test_failure_recovery_payment_timeout(recovery_engine: FailureRecoveryEngine) -> None:
    res = recovery_engine.evaluate_failure("PAYMENT_TIMEOUT", {"booking_id": "BK-1234"}, language="en")
    assert res["error_category"] == "PAYMENT_TIMEOUT"
    assert res["inventory_hold_active"] is True
    assert res["lock_expiry_seconds"] == 240
    assert res["can_auto_retry"] is True
    assert "locked for 4 more minutes" in res["recommended_action"]


def test_failure_recovery_localized_bengali(recovery_engine: FailureRecoveryEngine) -> None:
    res = recovery_engine.evaluate_failure("502_QUEUE_OVERFLOW", language="bn")
    assert res["error_category"] == "DATABASE_QUEUE_SATURATED"
    assert "তৎকাল ভিড়" in res["title"]
    assert "#৪২" in res["recommended_action"]
