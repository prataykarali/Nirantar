"""
NIRANTAR Module 1 — Citizen API Endpoints
=========================================
Citizen journey with Kavach trust evaluation and Dhara admission on every step.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from contracts.citizen import CitizenIntent, CitizenJourneyResponse, CitizenSession
from backend.app.services.citizen.intent_extractor import MultilingualIntentExtractor
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


@router.post("/intent")
def extract_citizen_intent(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Extract structured intent from text or voice audio."""
    query = payload.get("query", "")
    language = payload.get("language", "hi")
    voice_b64 = payload.get("voice_audio_base64")

    if voice_b64:
        _, intent = voice_adapter.process_voice_request(voice_b64, language)
    else:
        intent = intent_extractor.extract_intent(query, language)

    dumped = intent.model_dump() if hasattr(intent, "model_dump") else intent.dict()
    return {
        "status": 200,
        "intent": dumped,
        **dumped,
    }


@router.post("/journey/step")
def advance_journey_step(payload: StepAdvanceRequest = Body(...)) -> Dict[str, Any]:
    """Advance citizen journey through progressive disclosure."""
    if payload.intent is not None:
        intent = payload.intent
    elif payload.query:
        intent = intent_extractor.extract_intent(payload.query, payload.language)
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
