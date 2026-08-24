"""
Nira structured-intent schema.

NVIDIA must return JSON with required fields:
  intent, entities, confidence, response

Invalid payloads are rejected and the caller falls back to Safe Assist.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


ALLOWED_INTENTS = (
    "SEARCH_TRAIN",
    "SEARCH_TRAINS",
    "COMPARE_TRAINS",
    "TRACK_TRAIN",
    "VIEW_TICKET",
    "VIEW_PAYMENT",
    "START_BOOKING",
    "BOOKING_HELP",
    "PAYMENT_HELP",
    "NAVIGATE",
    "AUTOFILL_HELP",
    "CANCEL_HELP",
    "GENERAL_HELP",
)

ALLOWED_TIMES = ("Morning", "Afternoon", "Evening", "Night", "Anytime")

NIRA_JSON_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["intent", "entities", "confidence", "response"],
    "properties": {
        "intent": {"type": "string", "enum": list(ALLOWED_INTENTS)},
        "entities": {
            "type": "object",
            "additionalProperties": True,
            "properties": {
                "from_station": {"type": ["string", "null"]},
                "to_station": {"type": ["string", "null"]},
                "date": {"type": ["string", "null"]},
                "date_label": {"type": ["string", "null"]},
                "time_of_day": {"type": ["string", "null"]},
                "passengers": {"type": ["integer", "null"]},
                "train_number": {"type": ["string", "null"]},
                "pnr": {"type": ["string", "null"]},
            },
        },
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "response": {"type": "string", "minLength": 1},
    },
}


class NiraSchemaError(ValueError):
    """Raised when NVIDIA output fails schema validation."""


class NiraEntities(BaseModel):
    from_station: Optional[str] = None
    to_station: Optional[str] = None
    date: Optional[str] = None
    date_label: Optional[str] = None
    time_of_day: Optional[str] = None
    passengers: Optional[int] = Field(default=None, ge=1, le=6)
    train_number: Optional[str] = None
    pnr: Optional[str] = None

    @field_validator("time_of_day")
    @classmethod
    def _normalize_time(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        cleaned = value.strip().title()
        aliases = {
            "Am": "Morning",
            "Pm": "Evening",
            "Overnight": "Night",
            "Any": "Anytime",
        }
        cleaned = aliases.get(cleaned, cleaned)
        return cleaned if cleaned in ALLOWED_TIMES else "Anytime"


class NiraIntentOutput(BaseModel):
    intent: str
    entities: NiraEntities = Field(default_factory=NiraEntities)
    confidence: float = Field(ge=0.0, le=1.0)
    response: str

    source: str = "nvidia"
    fallback_reason: Optional[str] = None
    is_action_safe: bool = True
    raw_transcript: str = ""

    @field_validator("intent")
    @classmethod
    def _intent_allowed(cls, value: str) -> str:
        intent = (value or "").strip().upper()
        aliases = {
            "BOOK_TRAIN": "SEARCH_TRAINS",
            "BOOK_TICKET": "SEARCH_TRAINS",
            "CHECK_AVAILABILITY": "SEARCH_TRAINS",
            "TRACK_STATUS": "TRACK_TRAIN",
            "GET_QUEUE_STATUS": "GENERAL_HELP",
            "RECOVER_PAYMENT": "PAYMENT_HELP",
            "EXPLAIN_FIELD": "GENERAL_HELP",
            "UNKNOWN": "GENERAL_HELP",
        }
        intent = aliases.get(intent, intent)
        if intent not in ALLOWED_INTENTS:
            raise ValueError(f"unsupported intent: {value}")
        return intent

    @field_validator("response")
    @classmethod
    def _response_present(cls, value: str) -> str:
        text = (value or "").strip()
        if not text:
            raise ValueError("response must be a non-empty string")
        return text


def validate_nira_payload(data: Any) -> NiraIntentOutput:
    """Validate raw NVIDIA JSON. Raises NiraSchemaError on any failure."""
    if not isinstance(data, dict):
        raise NiraSchemaError("NVIDIA output is not a JSON object")

    required: List[str] = ["intent", "entities", "confidence", "response"]
    missing = [key for key in required if key not in data]
    if missing:
        raise NiraSchemaError(f"missing required fields: {', '.join(missing)}")

    if not isinstance(data.get("entities"), dict):
        raise NiraSchemaError("entities must be a JSON object")

    try:
        return NiraIntentOutput.model_validate(data)
    except Exception as exc:
        raise NiraSchemaError(str(exc)) from exc
