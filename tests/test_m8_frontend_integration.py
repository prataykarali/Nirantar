"""
NIRANTAR Module 8 — Frontend Integration & Citizen Experience Test Suite
========================================================================
Validates:
  1. Multilingual locale dictionary completeness (Hindi, Bengali, Tamil, English)
     in frontend JSON files, backend PROMPTS, INTENT_LABELS, and EXPLANATIONS_KNOWLEDGE_BASE.
  2. Voice Base64 audio decoding, data URL handling, invalid payload handling,
     script detection logic (Tamil, Bengali, Devanagari Hindi, Latin English), and STT pipeline.
  3. Progressive journey stepper state transitions (INTENT -> CONFIRM -> SEARCH -> SELECT -> PASSENGER -> REVIEW -> PAY -> DONE).
  4. Zero-PII safe autofill client contract compliance, strict filtering of sensitive fields (passwords, OTPs, CVVs, PINs, Aadhaar), and API endpoints.
"""

import base64
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

import pytest
from fastapi.testclient import TestClient

from contracts.citizen import (
    CitizenIntent,
    CitizenSession,
    IntentType,
    SafeAutofillPayload,
    VoiceTranscriptionResult,
)
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.journey_engine import (
    ProgressiveJourneyEngine,
    JourneyStage,
    INTENT_LABELS,
    STATION_LABELS,
)
from backend.app.services.citizen.autofill import SafeAutofillEngine
from backend.app.api.citizen import EXPLANATIONS_KNOWLEDGE_BASE
from backend.app.main import app
from security.privacy.masking import mask_name


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def extractor() -> MultilingualIntentExtractor:
    return MultilingualIntentExtractor()


@pytest.fixture
def voice_adapter(extractor: MultilingualIntentExtractor) -> VoiceInterfaceAdapter:
    return VoiceInterfaceAdapter(extractor)


@pytest.fixture
def journey_engine() -> ProgressiveJourneyEngine:
    engine = ProgressiveJourneyEngine()
    if hasattr(engine, "booking_svc") and hasattr(engine.booking_svc, "payment_service"):
        engine.booking_svc.payment_service.failure_rate = 0.0
        engine.booking_svc.payment_service.timeout_rate = 0.0
    return engine


@pytest.fixture
def autofill_engine() -> SafeAutofillEngine:
    return SafeAutofillEngine()


# =====================================================================
# 1. Multilingual Locale Dictionary Completeness Tests
# =====================================================================

def test_frontend_locale_json_completeness() -> None:
    """Verify frontend locale JSON files (en, hi, bn, ta) exist and contain complete key paths."""
    locales_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "locales")
    assert os.path.exists(locales_dir), f"Locales directory missing: {locales_dir}"

    languages = ["en", "hi", "bn", "ta"]
    dictionaries: Dict[str, Dict[str, Any]] = {}

    for lang in languages:
        filepath = os.path.join(locales_dir, f"{lang}.json")
        assert os.path.isfile(filepath), f"Missing locale JSON file: {filepath}"
        with open(filepath, "r", encoding="utf-8") as f:
            dictionaries[lang] = json.load(f)

    en_dict = dictionaries["en"]
    required_sections = ["nav", "stepper", "voice", "autofill", "stations", "common"]

    for section in required_sections:
        assert section in en_dict, f"English locale missing section '{section}'"
        en_keys = set(en_dict[section].keys())

        for lang in ["hi", "bn", "ta"]:
            lang_dict = dictionaries[lang]
            assert section in lang_dict, f"Locale '{lang}' missing section '{section}'"
            lang_keys = set(lang_dict[section].keys())
            missing_keys = en_keys - lang_keys
            assert not missing_keys, f"Locale '{lang}' missing keys in section '{section}': {missing_keys}"

            for key in en_keys:
                val = lang_dict[section][key]
                assert isinstance(val, str) and len(val.strip()) > 0, (
                    f"Locale '{lang}' has empty or invalid value for '{section}.{key}'"
                )


def test_backend_journey_prompts_multilingual_completeness(journey_engine: ProgressiveJourneyEngine) -> None:
    """Verify backend journey engine PROMPTS exist and are non-empty for all 4 target languages."""
    target_languages = ["en", "hi", "bn", "ta"]
    required_prompt_keys = [
        "ask_origin",
        "ask_destination",
        "select_train",
        "enter_passengers",
        "review",
        "confirm_booking",
    ]

    for lang in target_languages:
        assert lang in journey_engine.PROMPTS, f"Journey engine PROMPTS missing language key '{lang}'"
        lang_prompts = journey_engine.PROMPTS[lang]
        for key in required_prompt_keys:
            assert key in lang_prompts, f"Language '{lang}' missing prompt key '{key}'"
            assert isinstance(lang_prompts[key], str) and len(lang_prompts[key].strip()) > 0, (
                f"Language '{lang}' prompt key '{key}' is empty"
            )


def test_intent_labels_multilingual_completeness() -> None:
    """Verify INTENT_LABELS dictionary covers all IntentTypes across all 4 target languages."""
    target_languages = ["en", "hi", "bn", "ta"]
    for intent_type in IntentType:
        assert intent_type in INTENT_LABELS, f"INTENT_LABELS missing IntentType '{intent_type}'"
        labels = INTENT_LABELS[intent_type]
        for lang in target_languages:
            assert lang in labels, f"IntentType '{intent_type}' missing translation for language '{lang}'"
            assert isinstance(labels[lang], str) and len(labels[lang].strip()) > 0, (
                f"IntentType '{intent_type}' has empty label for language '{lang}'"
            )


def test_explanations_knowledge_base_multilingual_completeness() -> None:
    """Verify EXPLANATIONS_KNOWLEDGE_BASE entries cover en, hi, bn, ta."""
    target_languages = ["en", "hi", "bn", "ta"]
    assert len(EXPLANATIONS_KNOWLEDGE_BASE) > 0, "EXPLANATIONS_KNOWLEDGE_BASE is empty"

    for term, explanations in EXPLANATIONS_KNOWLEDGE_BASE.items():
        for lang in target_languages:
            assert lang in explanations, f"Term '{term}' missing explanation for language '{lang}'"
            assert isinstance(explanations[lang], str) and len(explanations[lang].strip()) > 0, (
                f"Term '{term}' has empty explanation for language '{lang}'"
            )


# =====================================================================
# 2. Voice Base64 Audio Decoding & Script Detection Logic Tests
# =====================================================================

def test_voice_base64_decoding_valid_payloads(voice_adapter: VoiceInterfaceAdapter) -> None:
    """Verify decoding valid base64 audio byte payloads with and without Data URL headers."""
    raw_pcm_bytes = b"RIFF1234WAVEfmt " + b"\x00" * 32
    raw_b64 = base64.b64encode(raw_pcm_bytes).decode("utf-8")

    # Plain Base64
    res_plain = voice_adapter.transcribe_audio_base64(raw_b64, language_hint="hi")
    assert res_plain["confidence"] > 0.8
    assert res_plain["is_fallback"] is False
    assert res_plain["error"] is None
    assert len(res_plain["transcript"]) > 0

    # Data URL prefixed Base64
    data_url_b64 = f"data:audio/wav;base64,{raw_b64}"
    res_url = voice_adapter.transcribe_audio_base64(data_url_b64, language_hint="bn")
    assert res_url["confidence"] > 0.8
    assert res_url["is_fallback"] is False
    assert res_url["error"] is None
    assert "শিয়ালদহ" in res_url["transcript"]


def test_voice_base64_decoding_invalid_payloads(voice_adapter: VoiceInterfaceAdapter) -> None:
    """Verify graceful error reporting on invalid, empty, or truncated Base64 audio inputs."""
    # Empty string
    res_empty = voice_adapter.transcribe_audio_base64("", language_hint="en")
    assert res_empty["confidence"] == 0.0
    assert res_empty["is_fallback"] is True
    assert "Empty or missing" in res_empty["error"]

    # Invalid Base64 characters
    res_bad_b64 = voice_adapter.transcribe_audio_base64("%%%NOT_BASE64_PAYLOAD%%%", language_hint="en")
    assert res_bad_b64["confidence"] == 0.0
    assert res_bad_b64["is_fallback"] is True
    assert "Invalid base64" in res_bad_b64["error"]

    # Truncated payload (<4 bytes)
    short_b64 = base64.b64encode(b"ab").decode("utf-8")
    res_short = voice_adapter.transcribe_audio_base64(short_b64, language_hint="en")
    assert res_short["confidence"] == 0.0
    assert res_short["is_fallback"] is True
    assert "too short or truncated" in res_short["error"]


def test_script_detection_logic(extractor: MultilingualIntentExtractor) -> None:
    """Verify script detection across Tamil, Bengali, Devanagari Hindi, and Latin English."""
    # Tamil script
    tamil_query = "சென்னையிலிருந்து மதுரைக்கு நாளை மாலை ரயில் பார்க்கவும்"
    assert extractor._detect_language(tamil_query, hint="auto") == "ta"

    # Bengali script
    bengali_query = "আমার কাল সন্ধ্যায় শিয়ালদহ থেকে নিউ জলপাইগুড়ি যেতে হবে"
    assert extractor._detect_language(bengali_query, hint="auto") == "bn"

    # Devanagari script (Hindi)
    hindi_query = "मुझे कल शाम सियालदह से न्यू जलपाईगुड़ी जाना है"
    assert extractor._detect_language(hindi_query, hint="auto") == "hi"

    # Latin script (English)
    english_query = "I need to book a ticket from Howrah to New Delhi"
    assert extractor._detect_language(english_query, hint="auto") == "en"

    # Explicit hint override
    assert extractor._detect_language(hindi_query, hint="bn") == "bn"


def test_voice_request_end_to_end_pipeline(voice_adapter: VoiceInterfaceAdapter) -> None:
    """Verify end-to-end voice query pipeline converting Base64 audio into structured CitizenIntent."""
    audio_bytes = b"RIFF....WAVEfmt...." + b"\x12" * 50
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    # Tamil hint
    transcript, intent = voice_adapter.process_voice_request(audio_b64, language_hint="ta")
    assert len(transcript) > 0
    assert intent.source_station == "MAS"
    assert intent.destination_station == "MDU"

    # Hindi hint
    transcript_hi, intent_hi = voice_adapter.process_voice_request(audio_b64, language_hint="hi")
    assert intent_hi.source_station == "SDAH"
    assert intent_hi.destination_station == "NJP"


# =====================================================================
# 3. Progressive Journey Stepper State Transitions Tests
# =====================================================================

def test_stepper_state_transitions_flow(journey_engine: ProgressiveJourneyEngine) -> None:
    """Verify state transition machine through INTENT -> CONFIRM -> SEARCH -> SELECT -> PASSENGER -> REVIEW -> PAY -> DONE."""
    session = CitizenSession(preferred_language="en")
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()

    # Step 1: Initial query -> CONFIRM / SEARCH stage (presents train choices at SELECT stage)
    intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="HWH",
        destination_station="NDLS",
        travel_date=tomorrow,
        class_preference="3A",
    )
    res_confirm = journey_engine.advance_journey(intent, session, JourneyStage.CONFIRM, {"confirmed": True})
    assert res_confirm.payload["stage"] in [JourneyStage.SELECT.value, JourneyStage.SEARCH.value, JourneyStage.CONFIRM.value]
    assert len(res_confirm.payload.get("top_options", [])) > 0

    selected_train = res_confirm.payload["top_options"][0]
    train_id = selected_train.get("train_no") or selected_train.get("train_id")

    # Step 2: Select train -> PASSENGER stage
    res_passenger = journey_engine.advance_journey(
        intent,
        session,
        JourneyStage.SELECT,
        {"train_no": train_id},
    )
    assert res_passenger.payload["stage"] == JourneyStage.PASSENGER.value

    # Step 3: Enter passenger -> REVIEW stage
    passengers = [{"name": "Rahul Verma", "age": 30}]
    res_review = journey_engine.advance_journey(
        intent,
        session,
        JourneyStage.PASSENGER,
        {"passengers": passengers, "train_no": train_id},
    )
    assert res_review.payload["stage"] == JourneyStage.REVIEW.value
    assert "selected_train" in res_review.payload or "booking_summary" in res_review.payload
    assert "passengers" in res_review.payload

    # Step 4: Pay -> DONE stage
    res_pay = journey_engine.advance_journey(
        intent,
        session,
        JourneyStage.REVIEW,
        {"pay": True, "passengers": passengers, "train_no": train_id},
    )
    assert res_pay.payload["stage"] == JourneyStage.DONE.value
    assert "pnr" in res_pay.payload


def test_stepper_incomplete_intent_requires_prompt(journey_engine: ProgressiveJourneyEngine) -> None:
    """Verify that incomplete intent state prompts for missing parameters before advancing."""
    session = CitizenSession(preferred_language="hi")
    incomplete_intent = CitizenIntent(
        intent_type=IntentType.BOOK_TRAIN,
        source_station="SDAH",
        destination_station=None,  # Missing destination
    )

    res = journey_engine.advance_journey(incomplete_intent, session, JourneyStage.CONFIRM, {})
    assert res.payload["stage"] in [JourneyStage.INTENT.value, JourneyStage.CONFIRM.value]
    assert res.action_required in ["PROVIDE_DESTINATION", "PROVIDE_ORIGIN", "PROVIDE_MISSING_INFO"]


# =====================================================================
# 4. Zero-PII Safe Autofill Client Contract Compliance Tests
# =====================================================================

def test_safe_autofill_contract_compliance(autofill_engine: SafeAutofillEngine) -> None:
    """Verify zero-PII safe autofill engine complies strictly with SafeAutofillPayload schema."""
    raw_user_payload = {
        "name": "Priya Das",
        "age": 28,
        "gender": "F",
        "berths": "Lower",
        "quota": "GN",
        "source_station": "HWH",
        "destination_station": "NDLS",
        "password": "SuperSecretPassword123",
        "otp": "987654",
        "cvv": "123",
        "pin": "4321",
        "aadhaar": "1234-5678-9012",
        "card_number": "4111222233334444",
        "auth_token": "bearer_secret_token",
    }

    autofill: SafeAutofillPayload = autofill_engine.prepare_autofill(raw_user_payload)

    # Check allowed safe fields are kept
    assert autofill.safe_data["name"] == "Priya Das"
    assert autofill.safe_data["age"] == 28
    assert autofill.safe_data["gender"] == "F"
    assert autofill.safe_data["quota"] == "GN"

    # Check forbidden sensitive fields are strictly excluded from safe_data
    forbidden_keys = ["password", "otp", "cvv", "pin", "aadhaar", "card_number", "auth_token"]
    for fkey in forbidden_keys:
        assert fkey not in autofill.safe_data, f"Forbidden key '{fkey}' leaked into safe_data!"
        assert fkey in autofill.filtered_out_fields, f"Forbidden key '{fkey}' missing from filtered_out_fields!"

    # Check schema metadata contracts
    assert len(autofill.allowed_fields) > 0
    assert "Passwords" in autofill.forbidden_fields
    assert "OTPs" in autofill.forbidden_fields
    assert "CVVs" in autofill.forbidden_fields
    assert "PINs" in autofill.forbidden_fields


def test_pii_name_masking_privacy() -> None:
    """Verify PII name masking utility produces safe anonymized tokens."""
    masked_1 = mask_name("Rahul Sharma")
    assert masked_1 != "Rahul Sharma"
    assert "R" in masked_1 and "*" in masked_1

    masked_short = mask_name("Om")
    assert "*" in masked_short


def test_citizen_api_autofill_endpoint_security(client: TestClient) -> None:
    """Verify FastAPI safe-fields endpoint returns 200 and excludes all PII credentials."""
    request_body = {
        "user_data": {
            "name": "Amit Sen",
            "age": 45,
            "quota": "GN",
            "password": "MyPassword",
            "cvv": "999",
            "pin": "1234",
            "otp": "8888",
        }
    }
    response = client.post("/api/v1/citizen/autofill/safe-fields", json=request_body)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == 200
    assert "safe_data" in data
    safe_data = data["safe_data"]

    # Assert allowed safe data (mapped to capitalized or lower keys)
    name_val = safe_data.get("Name") or safe_data.get("name")
    age_val = safe_data.get("Age") or safe_data.get("age")
    assert name_val == "Amit Sen"
    assert age_val == 45

    # Assert zero forbidden sensitive data in response
    for forbidden_field in ["password", "cvv", "pin", "otp"]:
        assert forbidden_field not in safe_data
        assert forbidden_field in data["filtered_out_fields"]
