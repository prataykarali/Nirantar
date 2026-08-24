"""
NIRANTAR Module 1 — Citizen API Endpoints
=========================================
Citizen journey with Kavach trust evaluation and Dhara admission on every step.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from contracts.citizen import CitizenIntent, CitizenJourneyResponse, CitizenSession, IntentType, SafeAutofillPayload
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
from backend.app.services.citizen.nira_parser import parse_nira_intent
from backend.app.services.citizen.voice_interface import VoiceInterfaceAdapter
from backend.app.services.citizen.journey_engine import ProgressiveJourneyEngine, JourneyStage
from backend.app.services.citizen.failure_recovery import FailureRecoveryEngine
from security.gateway import KavachGateway
from orchestrator.decision_engine.engine import DharaEngine

router = APIRouter(prefix="/api/v1/citizen", tags=["Citizen Journey"])

intent_extractor = MultilingualIntentExtractor()
voice_adapter = VoiceInterfaceAdapter(intent_extractor)
journey_engine = ProgressiveJourneyEngine()
recovery_engine = FailureRecoveryEngine()
kavach = KavachGateway()
dhara = DharaEngine()


class StepAdvanceRequest(BaseModel):
    intent: Optional[CitizenIntent] = None
    query: Optional[str] = None
    language: str = "hi"
    session: Optional[CitizenSession] = None
    stage: Optional[str] = None
    current_stage: Optional[str] = None
    selection: Dict[str, Any] = Field(default_factory=dict)


class AutofillRequest(BaseModel):
    user_data: Optional[Dict[str, Any]] = None


class ExplainRequest(BaseModel):
    term_or_field: str = Field(..., description="Civic term, error code, or field name to explain")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    language: str = "en"


EXPLANATIONS_KNOWLEDGE_BASE = {
    "quota": {
        "en": "Quota specifies ticket allocation pools such as General (GN), Tatkal (TQ), Ladies (LD), or Senior Citizen (SS).",
        "hi": "कोटा सामान्य (GN), तत्काल (TQ), महिला (LD), या वरिष्ठ नागरिक (SS) जैसी श्रेणी निर्दिष्ट करता है।",
        "bn": "কোটা সাধারণ (GN), তৎকাল (TQ), মহিলা (LD), বা প্রবীণ নাগরিক (SS) ইত্যাদির মতো আসন বরাদ্দপুল চিহ্নিত করে।",
        "ta": "கோட்டா என்பது பொது (GN), தட்கல் (TQ), மகளிர் (LD) போன்ற இட ஒதுக்கீடு பிரிவுகளைக் குறிக்கிறது.",
    },
    "3a": {
        "en": "3A stands for AC 3-Tier, providing air-conditioned berths with blankets and bedsheets.",
        "hi": "3A का अर्थ है एसी 3-टियर, जिसमें वातानुकूलित बर्थ और बिस्तर मिलते हैं।",
        "bn": "3A মানে এসি ৩-টায়ার, যা শীতাতপ নিয়ন্ত্রিত আসন এবং বিছানা সরবরাহ করে।",
        "ta": "3A என்பது ஏசி 3-டயர் இருக்கைப் பிரிவைக் குறிக்கிறது.",
    },
    "gn": {
        "en": "General Quota (GN) is open for booking to all citizens without special conditions.",
        "hi": "सामान्य कोटा (GN) बिना किसी विशेष शर्त के सभी नागरिकों के लिए खुला है।",
        "bn": "সাধারণ কোটা (GN) বিশেষ কোনো শর্ত ছাড়াই সমস্ত নাগরিকের জন্য উন্মুক্ত।",
        "ta": "பொது கோட்டா (GN) எந்த சிறப்பு நிபந்தனையும் இன்றி அனைத்து குடிமக்களுக்கும் திறந்தது.",
    },
    "tq": {
        "en": "Tatkal Quota (TQ) allows emergency last-minute bookings usually starting 1 day prior to journey.",
        "hi": "तत्काल कोटा (TQ) यात्रा से 1 दिन पहले आपातकालीन बुकिंग की अनुमति देता है।",
        "bn": "তৎকাল কোটা (TQ) যাত্রার ১ দিন আগে জরুরি ভিত্তিতে টিকিট কাটার সুযোগ দেয়।",
        "ta": "தட்கல் கோட்டா (TQ) பயணத்திற்கு 1 நாள் முன்பு அவசர முன்பதிவை அனுமதிக்கிறது.",
    },
    "pnr": {
        "en": "Passenger Name Record (PNR) is a unique 10-digit code assigned to your railway reservation.",
        "hi": "पीएनआर (PNR) आपकी रेलवे बुकिंग के लिए 10 अंकों का विशिष्ट कोड है।",
        "bn": "পিএনআর (PNR) হলো আপনার রেল বুকিংয়ের জন্য বরাদ্দকৃত ১০ সংখ্যার একটি অনন্য কোড।",
        "ta": "பிஎன்ஆர் (PNR) என்பது உங்கள் ரயில் முன்பதிவுக்கான 10 இலக்க தனித்துவமான குறியீடாகும்.",
    },
}


def _stage_from(payload: StepAdvanceRequest) -> JourneyStage:
    stage_str = payload.current_stage or payload.stage or "INTENT"
    if stage_str in JourneyStage.__members__:
        return JourneyStage[stage_str]
    for member in JourneyStage:
        if member.value == stage_str:
            return member
    return JourneyStage.INTENT


def _endpoint_for(stage: JourneyStage) -> str:
    mapping = {
        JourneyStage.INTENT: "HOME",
        JourneyStage.CONFIRM: "HOME",
        JourneyStage.SEARCH: "SEARCH",
        JourneyStage.SELECT: "SELECT",
        JourneyStage.PASSENGER: "SELECT",
        JourneyStage.REVIEW: "BOOK",
        JourneyStage.PAY: "BOOK",
        JourneyStage.DONE: "BOOK",
    }
    return mapping.get(stage, "SEARCH")


_NIRA_TO_CITIZEN = {
    "SEARCH_TRAINS": IntentType.SEARCH_TRAINS,
    "TRACK_TRAIN": IntentType.TRACK_STATUS,
    "VIEW_TICKET": IntentType.TRACK_STATUS,
    "PAYMENT_HELP": IntentType.RECOVER_PAYMENT,
    "GENERAL_HELP": IntentType.EXPLAIN_FIELD,
}


@router.post("/intent")
def extract_citizen_intent(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Extract structured intent via NVIDIA JSON, with Safe Assist fallback."""
    query = payload.get("query", "")
    language = payload.get("language", "hi")
    voice_b64 = payload.get("voice_audio_base64")

    if voice_b64:
        _, intent = voice_adapter.process_voice_request(voice_b64, language)
        dumped = intent.model_dump() if hasattr(intent, "model_dump") else intent.dict()
        return {"status": 200, "intent": dumped, **dumped}

    nira = parse_nira_intent(query, language or "en")
    entities = nira.get("entities") or {}
    citizen = CitizenIntent(
        intent_type=_NIRA_TO_CITIZEN.get(nira.get("intent"), IntentType.SEARCH_TRAINS),
        source_station=(entities.get("from") or {}).get("code") or entities.get("from_station"),
        destination_station=(entities.get("to") or {}).get("code") or entities.get("to_station"),
        travel_date=entities.get("date"),
        language=language or "en",
        time_preference=entities.get("timeOfDay") or entities.get("time_of_day"),
        passenger_count=int(entities.get("passengers") or 1),
        confidence=float(nira.get("confidence") or 0.0),
        entities=entities,
        raw_query=query,
    )
    dumped = citizen.model_dump()
    return {
        "status": 200,
        "intent": dumped,
        **dumped,
        **nira,
    }


@router.post("/journey/step")
def advance_journey_step(payload: StepAdvanceRequest = Body(...)) -> Dict[str, Any]:
    """Advance citizen journey through progressive disclosure with smart Nira conversational answering."""
    if payload.intent is not None:
        intent = payload.intent
    elif payload.query:
        nira = parse_nira_intent(payload.query, payload.language or "en")
        nira_intent_type = nira.get("intent", "GENERAL_HELP")

        # Conversational greetings, railway FAQs, and general questions
        if nira_intent_type == "GENERAL_HELP":
            return {
                "message": nira.get("response", "Hello! I'm Nira, your 24/7 AI Railway Companion. How can I help you with your journey today?"),
                "intent": {
                    "intent_type": "EXPLAIN_FIELD",
                    "raw_query": payload.query,
                    "confidence": nira.get("confidence", 0.95),
                },
                "session": {"session_id": "ses_live"},
                "action_required": "INFORM",
                "payload": {
                    "nira_response": nira.get("response"),
                    "stage": "INTENT",
                },
            }

        entities = nira.get("entities") or {}
        intent = CitizenIntent(
            intent_type=_NIRA_TO_CITIZEN.get(nira.get("intent"), IntentType.SEARCH_TRAINS),
            source_station=(entities.get("from") or {}).get("code") or entities.get("from_station"),
            destination_station=(entities.get("to") or {}).get("code") or entities.get("to_station"),
            travel_date=entities.get("date"),
            language=payload.language or "en",
            time_preference=entities.get("timeOfDay") or entities.get("time_of_day"),
            passenger_count=int(entities.get("passengers") or 1),
            confidence=float(nira.get("confidence") or 0.0),
            entities=entities,
            raw_query=payload.query,
        )
    else:
        intent = CitizenIntent(language=payload.language)

    session = payload.session or CitizenSession(preferred_language=payload.language)
    journey_stage = _stage_from(payload)

    assessment, allowed, reason = kavach.evaluate(
        session.session_id,
        _endpoint_for(journey_stage),
        ip_hash=session.ip_hash,
        is_retry=payload.selection.get("retry") is True,
    )
    decision = dhara.decide(
        assessment=assessment,
        overload_probability=0.12,
        endpoint=_endpoint_for(journey_stage),
        session_id=session.session_id,
    )

    if not allowed and reason == "rate_limited":
        blocked = CitizenJourneyResponse(
            message="Too many requests in a short time. Please wait a moment — legitimate bookings are protected, not blocked.",
            intent=intent,
            session=session,
            action_required="WAIT_AND_RETRY",
            payload={"stage": journey_stage.value},
        )
        body = blocked.model_dump()
        body["payload"]["kavach"] = kavach.dump(assessment, reason)
        body["payload"]["dhara"] = dhara.dump(decision)
        return body

    resp = journey_engine.advance_journey(intent, session, journey_stage, payload.selection)
    body = resp.model_dump() if hasattr(resp, "model_dump") else resp.dict()
    body.setdefault("payload", {})
    body["payload"]["kavach"] = kavach.dump(assessment, reason)
    body["payload"]["dhara"] = dhara.dump(decision)
    if decision.queue.should_enqueue:
        body["queue_position"] = decision.queue.priority_level
        body["estimated_wait_seconds"] = 8
    return body


@router.post("/failure-recovery")
def get_failure_recovery(
    error_code: str = Body(..., embed=True),
    language: str = Body(default="en", embed=True),
    context: Dict[str, Any] = Body(default_factory=dict, embed=True),
) -> Dict[str, Any]:
    """Retrieve human-friendly failure recovery instructions and inventory lock status."""
    return recovery_engine.evaluate_failure(error_code, context, language)


@router.get("/autofill/safe-fields")
@router.post("/autofill/safe-fields")
def get_safe_autofill_fields(payload: Optional[AutofillRequest] = None) -> Dict[str, Any]:
    """Retrieve non-sensitive safe field allowlist and filter provided user profile data."""
    raw_data = payload.user_data if payload else None
    result = journey_engine.get_safe_autofill_data(raw_data)
    dumped = result.model_dump() if hasattr(result, "model_dump") else result.dict()
    return {
        "status": 200,
        **dumped,
    }


@router.post("/explain")
def explain_citizen_field_or_term(payload: ExplainRequest = Body(...)) -> Dict[str, Any]:
    """Provide human-friendly explanations for civic terms, form fields, or error codes."""
    term = payload.term_or_field.strip().lower()
    lang = payload.language if payload.language in ["hi", "bn", "ta", "en"] else "en"

    # Check if term is an error code
    if any(err_kw in term for err_kw in ["timeout", "throttled", "expired", "failed", "queue", "saturated", "502", "504", "429", "unknown"]):
        eval_result = recovery_engine.evaluate_failure(payload.term_or_field, payload.context, payload.language)
        return {
            "status": 200,
            "term": payload.term_or_field,
            "category": "ERROR_EXPLANATION",
            "title": eval_result["title"],
            "explanation": eval_result["human_explanation"],
            "recommended_action": eval_result["recommended_action"],
            "language": lang,
        }

    # Check predefined terms
    matching_key = next((k for k in EXPLANATIONS_KNOWLEDGE_BASE if k in term), None)
    if matching_key:
        explanation = EXPLANATIONS_KNOWLEDGE_BASE[matching_key].get(lang, EXPLANATIONS_KNOWLEDGE_BASE[matching_key]["en"])
        title = f"Understanding '{payload.term_or_field.upper()}'"
    else:
        title = f"Form Field: {payload.term_or_field}"
        explanation = f"In NIRANTAR public service forms, '{payload.term_or_field}' is a standard field used to process civic intent."

    return {
        "status": 200,
        "term": payload.term_or_field,
        "category": "FIELD_EXPLANATION",
        "title": title,
        "explanation": explanation,
        "language": lang,
    }
