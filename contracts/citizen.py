"""
NIRANTAR Contracts — Citizen Journey & Intent Schemas
=====================================================
Owned by Agent 4 (SAATHI / Experience) and validated by Agent 1 (ORBIT / Architect).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class IntentType(str, Enum):
    SEARCH_TRAINS = "SEARCH_TRAINS"
    CHECK_AVAILABILITY = "CHECK_AVAILABILITY"
    BOOK_TRAIN = "BOOK_TRAIN"
    GET_QUEUE_STATUS = "GET_QUEUE_STATUS"
    CIVIC_APPLICATION = "CIVIC_APPLICATION"
    TRACK_STATUS = "TRACK_STATUS"
    EXPLAIN_FIELD = "EXPLAIN_FIELD"
    AUTOFILL_SAFE_DATA = "AUTOFILL_SAFE_DATA"
    RECOVER_PAYMENT = "RECOVER_PAYMENT"
    UNKNOWN = "UNKNOWN"


class ChannelType(str, Enum):
    WEB_PORTAL = "WEB_PORTAL"
    MOBILE_APP = "MOBILE_APP"
    VOICE_AGENT = "VOICE_AGENT"
    CHAT_BOT = "CHAT_BOT"


class SafeAutofillPayload(BaseModel):
    """Schema defining allowed non-sensitive autofill fields and forbidden sensitive fields."""
    allowed_fields: List[str] = Field(
        default_factory=lambda: ["Name", "Age", "Gender", "Berths", "Quota", "Origin", "Destination"]
    )
    forbidden_fields: List[str] = Field(
        default_factory=lambda: ["Passwords", "OTPs", "CVVs", "PINs"]
    )
    safe_data: Dict[str, Any] = Field(default_factory=dict)
    filtered_out_fields: List[str] = Field(default_factory=list)


class VoiceTranscriptionResult(BaseModel):
    """Structured result schema from voice audio transcription."""
    transcript: str = ""
    language: str = "en"
    byte_length: Optional[int] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    is_fallback: bool = False
    error: Optional[str] = None


class CitizenIntent(BaseModel):
    """Structured intent parsed from natural language citizen input."""
    intent_id: str = Field(default_factory=lambda: f"INT-{uuid.uuid4().hex[:8].upper()}")
    intent_type: IntentType = IntentType.SEARCH_TRAINS
    source_station: Optional[str] = None
    destination_station: Optional[str] = None
    travel_date: Optional[str] = None
    class_preference: str = "3A"
    quota: str = "GN"
    language: str = "hi"
    time_preference: Optional[str] = None
    passenger_count: int = 1
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    entities: Dict[str, Any] = Field(default_factory=dict)
    raw_query: str = ""


class CitizenSession(BaseModel):
    """Anonymized citizen session state."""
    session_id: str = Field(default_factory=lambda: f"SES-{uuid.uuid4().hex[:10]}")
    citizen_id_masked: str = "CIT-001"
    auth_token: str = Field(default_factory=lambda: f"tok_{uuid.uuid4().hex[:12]}")
    channel: ChannelType = ChannelType.WEB_PORTAL
    preferred_language: str = "hi"
    ip_hash: str = "ip_hash_local"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CitizenJourneyRequest(BaseModel):
    """Inbound citizen request payload."""
    query: str
    session_id: Optional[str] = None
    channel: ChannelType = ChannelType.WEB_PORTAL
    language: str = "hi"
    voice_audio_base64: Optional[str] = None


class CitizenJourneyResponse(BaseModel):
    """Outbound structured journey response."""
    journey_id: str = Field(default_factory=lambda: f"JRN-{uuid.uuid4().hex[:8].upper()}")
    message: str
    intent: CitizenIntent
    session: CitizenSession
    queue_position: Optional[int] = None
    estimated_wait_seconds: Optional[int] = None
    action_required: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
