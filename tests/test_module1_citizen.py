"""
NIRANTAR Module 1 — Citizen UX & Journey Intelligence Comprehensive Test Suite
==============================================================================
Validates:
1. Multilingual Intent Extraction across English, Hindi, Bengali, and Tamil.
2. Complete 8-stage state machine transition:
   INTENT -> CONFIRM -> SEARCH -> SELECT -> PASSENGER -> REVIEW -> PAY -> DONE.
3. Zero-PII safety boundary invariants (verify LLM prompts & autofill reject sensitive fields).
4. Voice base64 audio ingestion, transcription, and fallback error handling.
5. Failure recovery engine for PAYMENT_TIMEOUT and DATABASE_QUEUE_SATURATED modes.
6. Safe autofill API and Zero-PII data boundary filtering.
"""

from datetime import datetime, timedelta, timezone
import base64
import pytest

from contracts.citizen import (
    CitizenIntent,
    CitizenSession,
    IntentType,
    SafeAutofillPayload,
)
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine, JourneyStage
from backend.app.services.citizen.failure_recovery import FailureRecoveryEngine
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.autofill import SafeAutofillEngine
from backend.app.adapters.llm.prompts import (
    SEMANTIC_ORCHESTRATION_PROMPT,
    SEMANTIC_INTENT_PROMPT,
    build_system_prompt,
)


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
def voice_adapter(extractor: MultilingualIntentExtractor) -> VoiceInterfaceAdapter:
    return VoiceInterfaceAdapter(extractor)


@pytest.fixture
def autofill_engine() -> SafeAutofillEngine:
    return SafeAutofillEngine()


# ============================================================================
# 1. MULTILINGUAL INTENT EXTRACTION TESTS (English, Hindi, Bengali, Tamil)
# ============================================================================

def test_multilingual_intent_english(extractor: MultilingualIntentExtractor) -> None:
    query = "I need to book a train from Sealdah to New Jalpaiguri tomorrow evening in 3A Tatkal for 2 passengers"
    intent = extractor.extract_intent(query, language="en")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.quota == "TQ"
    assert intent.class_preference == "3A"
    assert intent.language == "en"
    assert intent.passenger_count == 2
    assert intent.entities.get("travel_time_preference") == "EVENING"
    assert intent.confidence >= 0.90


def test_multilingual_intent_hindi(extractor: MultilingualIntentExtractor) -> None:
    query = "मुझे कल शाम सियालदह से न्यू जलपाईगुड़ी 3A तत्काल टिकट चाहिए"
    intent = extractor.extract_intent(query, language="hi")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.quota == "TQ"
    assert intent.class_preference == "3A"
    assert intent.language == "hi"
    assert intent.entities.get("travel_time_preference") == "EVENING"


def test_multilingual_intent_bengali(extractor: MultilingualIntentExtractor) -> None:
    query = "আমার কাল সন্ধ্যায় শিয়ালদহ থেকে নিউ জলপাইগুড়ি যেতে হবে"
    intent = extractor.extract_intent(query, language="bn")
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"
    assert intent.language == "bn"
    assert intent.entities.get("travel_time_preference") == "EVENING"


def test_multilingual_intent_tamil(extractor: MultilingualIntentExtractor) -> None:
    query = "எனக்கு நாளை மாலை சென்னை சென்ட்ரல் முதல் மதுரை வரை 3A தட்கல் ரயில் புக் செய்ய வேண்டும்"
    intent = extractor.extract_intent(query, language="ta")
    assert intent.source_station == "MAS"
    assert intent.destination_station == "MDU"
    assert intent.language == "ta"
    assert intent.quota == "TQ"
    assert intent.class_preference == "3A"


def test_tamil_script_auto_detection(extractor: MultilingualIntentExtractor) -> None:
    query = "சென்னை முதல் மதுரை வரை ரயில்"
    intent = extractor.extract_intent(query, language="auto")
    assert intent.language == "ta"
    assert intent.source_station == "MAS"
    assert intent.destination_station == "MDU"


# ============================================================================
# 2. STATE MACHINE TRANSITIONS (INTENT -> CONFIRM -> SEARCH -> SELECT -> PASSENGER -> REVIEW -> PAY -> DONE)
# ============================================================================

def test_full_state_machine_transition_flow(journey_engine: ProgressiveJourneyEngine) -> None:
    journey_engine.payment_svc.failure_rate = 0.0
    journey_engine.payment_svc.timeout_rate = 0.0
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    session = CitizenSession()

    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date=tomorrow,
        class_preference="3A",
        quota="GN",
        language="en",
        passenger_count=1,
        raw_query="Book train from Howrah to New Delhi tomorrow in 3A",
    )

    # Stage 1: INTENT -> CONFIRM
    res1 = journey_engine.advance_journey(intent, session, current_stage=JourneyStage.INTENT)
    assert res1.action_required == "CONFIRM_INTENT"
    assert res1.payload["stage"] == JourneyStage.CONFIRM.value

    # Stage 2: CONFIRM -> SEARCH
    res2 = journey_engine.advance_journey(
        intent, session, current_stage=JourneyStage.CONFIRM, user_selection={"confirmed": True}
    )
    assert res2.action_required == "SELECT_TRAIN"
    assert res2.payload["stage"] in (JourneyStage.SEARCH.value, JourneyStage.SELECT.value)

    # Stage 3: SEARCH -> SELECT
    res3 = journey_engine.advance_journey(
        intent, session, current_stage=JourneyStage.SEARCH, user_selection={"search": True}
    )
    assert res3.action_required == "SELECT_TRAIN"
    assert res3.payload["stage"] == JourneyStage.SELECT.value
    top_options = res3.payload["top_options"]
    assert len(top_options) > 0
    selected_train = top_options[0]["train_no"]
    fare = top_options[0]["fare_inr"]

    # Stage 4: SELECT -> PASSENGER
    res4 = journey_engine.advance_journey(
        intent,
        session,
        current_stage=JourneyStage.SELECT,
        user_selection={"train_no": selected_train, "fare_inr": fare},
    )
    assert res4.action_required == "PROVIDE_PASSENGERS"
    assert res4.payload["stage"] == JourneyStage.PASSENGER.value

    # Stage 5: PASSENGER -> REVIEW
    passengers = [{"name": "Aarav Sharma", "age": 28, "gender": "M"}]
    res5 = journey_engine.advance_journey(
        intent,
        session,
        current_stage=JourneyStage.PASSENGER,
        user_selection={"train_no": selected_train, "fare_inr": fare, "passengers": passengers},
    )
    assert res5.action_required == "REVIEW_CONFIRM"
    assert res5.payload["stage"] == JourneyStage.REVIEW.value

    # Stage 6: REVIEW -> PAY
    res6 = journey_engine.advance_journey(
        intent,
        session,
        current_stage=JourneyStage.REVIEW,
        user_selection={"pay": True, "train_no": selected_train, "fare_inr": fare, "passengers": passengers},
    )
    assert res6.action_required == "BOOKING_CONFIRMED"
    assert res6.payload["stage"] == JourneyStage.DONE.value

    # Stage 7 & 8: PAY & DONE verification
    res7 = journey_engine.advance_journey(
        intent,
        session,
        current_stage=JourneyStage.PAY,
        user_selection={"train_no": selected_train, "fare_inr": fare, "passengers": passengers},
    )
    assert res7.payload["stage"] == JourneyStage.DONE.value
    assert res7.payload["status"] == "CONFIRMED"
    assert "pnr" in res7.payload and len(res7.payload["pnr"]) > 0


# ============================================================================
# 3. ZERO-PII SAFETY BOUNDARY INVARIANTS & LLM PROMPTS
# ============================================================================

def test_zero_pii_llm_prompts_safety_boundary() -> None:
    system_prompt = build_system_prompt()
    assert "ZERO HARDCODING" in system_prompt
    assert "NO HALLUCINATION" in system_prompt
    assert "DATA SUPREMACY" in system_prompt

    intent_prompt = SEMANTIC_INTENT_PROMPT
    assert "zero hardcoding" in intent_prompt.lower()
    assert "password" not in intent_prompt.lower()
    assert "cvv" not in intent_prompt.lower()
    assert "otp" not in intent_prompt.lower()


def test_zero_pii_autofill_rejection(autofill_engine: SafeAutofillEngine) -> None:
    raw_user_input = {
        "name": "Priya Sen",
        "age": 32,
        "gender": "F",
        "quota": "GN",
        "origin": "HWH",
        "destination": "NDLS",
        "password": "SuperSecretPassword123!",
        "otp": "987654",
        "cvv": "432",
        "pin": "110001",
        "aadhaar": "1234-5678-9012",
        "card_number": "4532-1111-2222-3333",
        "auth_token": "bearer_secret_xyz",
    }

    result: SafeAutofillPayload = autofill_engine.prepare_autofill(raw_user_input)

    assert "password" in result.filtered_out_fields
    assert "otp" in result.filtered_out_fields
    assert "cvv" in result.filtered_out_fields
    assert "pin" in result.filtered_out_fields
    assert "aadhaar" in result.filtered_out_fields
    assert "card_number" in result.filtered_out_fields
    assert "auth_token" in result.filtered_out_fields

    assert result.safe_data.get("name") == "Priya Sen"
    assert result.safe_data.get("age") == 32
    assert result.safe_data.get("origin") == "HWH"
    assert result.safe_data.get("destination") == "NDLS"

    for sensitive_key in ["password", "otp", "cvv", "pin", "aadhaar", "card_number", "auth_token"]:
        assert sensitive_key not in result.safe_data


# ============================================================================
# 4. VOICE BASE64 AUDIO HANDLING
# ============================================================================

def test_voice_base64_audio_transcription(voice_adapter: VoiceInterfaceAdapter) -> None:
    valid_pcm_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00"
    base64_payload = base64.b64encode(valid_pcm_audio).decode("utf-8")

    res = voice_adapter.transcribe_audio_base64(base64_payload, language_hint="hi")
    assert res["language"] == "hi"
    assert res["confidence"] >= 0.90
    assert res["byte_length"] == len(valid_pcm_audio)
    assert len(res["transcript"]) > 0

    transcript, intent = voice_adapter.process_voice_request(base64_payload, language_hint="hi")
    assert len(transcript) > 0
    assert isinstance(intent, CitizenIntent)
    assert intent.source_station == "SDAH"
    assert intent.destination_station == "NJP"


def test_voice_base64_audio_invalid_and_empty_payload(voice_adapter: VoiceInterfaceAdapter) -> None:
    empty_res = voice_adapter.transcribe_audio_base64("", language_hint="en")
    assert empty_res["transcript"] == ""
    assert empty_res["confidence"] == 0.0

    invalid_res = voice_adapter.transcribe_audio_base64("!!!InvalidBase64String!!!", language_hint="en")
    assert "error" in invalid_res
    assert invalid_res["confidence"] == 0.0


# ============================================================================
# 5. FAILURE RECOVERY ENGINE (PAYMENT_TIMEOUT & DATABASE_QUEUE_SATURATED)
# ============================================================================

def test_failure_recovery_payment_timeout(recovery_engine: FailureRecoveryEngine) -> None:
    context = {"booking_id": "BK-98765", "amount_inr": 1850}
    res_en = recovery_engine.evaluate_failure("PAYMENT_TIMEOUT", context, language="en")
    assert res_en["error_category"] == "PAYMENT_TIMEOUT"
    assert res_en["inventory_hold_active"] is True
    assert res_en["lock_expiry_seconds"] == 240
    assert res_en["can_auto_retry"] is True
    assert "Payment Verification Delayed" in res_en["title"]
    assert "Retry Payment" in res_en["recommended_action"]

    res_hi = recovery_engine.evaluate_failure("PAYMENT_TIMEOUT", context, language="hi")
    assert res_hi["error_category"] == "PAYMENT_TIMEOUT"
    assert "भुगतान सत्यापन" in res_hi["title"]


def test_failure_recovery_database_queue_saturated(recovery_engine: FailureRecoveryEngine) -> None:
    res_en = recovery_engine.evaluate_failure("DATABASE_QUEUE_SATURATED", language="en")
    assert res_en["error_category"] == "DATABASE_QUEUE_SATURATED"
    assert res_en["inventory_hold_active"] is False
    assert res_en["can_auto_retry"] is False
    assert "High Booking Demand" in res_en["title"]
    assert "priority queue" in res_en["human_explanation"]

    res_502 = recovery_engine.evaluate_failure("502_BAD_GATEWAY", language="bn")
    assert res_502["error_category"] == "DATABASE_QUEUE_SATURATED"
    assert "অতিরিক্ত বুকিং চাপ" in res_502["title"]


# ============================================================================
# 6. SAFE AUTOFILL API
# ============================================================================

def test_safe_autofill_api_integration(autofill_engine: SafeAutofillEngine) -> None:
    raw_payload = {
        "Name": "Amitav Ghosh",
        "Age": 45,
        "Gender": "M",
        "Origin": "HWH",
        "Destination": "NDLS",
        "password": "SecretPassword",
        "otp": "123456",
        "pin": "700001",
    }

    result = autofill_engine.prepare_autofill(raw_payload)
    assert isinstance(result, SafeAutofillPayload)
    assert len(result.safe_data) > 0
    assert result.safe_data["Name"] == "Amitav Ghosh"
    assert result.safe_data["Age"] == 45
    assert set(result.filtered_out_fields) == {"password", "otp", "pin"}
