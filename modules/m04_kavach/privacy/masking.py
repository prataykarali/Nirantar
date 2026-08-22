"""KAVACH — PII minimization & zero-PII masking engine."""

from __future__ import annotations

from typing import Any, Dict, Tuple

SENSITIVE_REDACT_KEYS = {
    "password", "otp", "cvv", "pin", "secret", "token",
    "auth_token", "private_key", "access_token", "refresh_token", "cvv_number"
}
NAME_KEYS = {"name", "full_name", "user_name", "username", "passenger_name"}
PHONE_KEYS = {"phone", "mobile", "contact", "phone_number", "mobile_number"}
CARD_KEYS = {"card", "card_number", "credit_card", "debit_card", "pan"}
AADHAAR_KEYS = {"aadhaar", "aadhaar_number"}


def mask_name(name: str) -> str:
    """Mask citizen name, preserving initial letters."""
    cleaned = (name or "").strip()
    if not cleaned:
        return "P****"
    parts = cleaned.split()
    masked = []
    for part in parts:
        if len(part) <= 1:
            masked.append(part + "***")
        else:
            masked.append(part[0] + "***")
    return " ".join(masked)


def mask_phone(phone: str) -> str:
    """Mask phone number preserving last 4 digits."""
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if len(digits) < 4:
        return "+91-********"
    return f"+91-******{digits[-4:]}"


def mask_card(card: str) -> str:
    """Mask credit/debit card number preserving last 4 digits."""
    digits = "".join(ch for ch in str(card or "") if ch.isdigit())
    if len(digits) < 4:
        return "****"
    return f"****-****-****-{digits[-4:]}"


def mask_aadhaar(aadhaar: str) -> str:
    """Mask 12-digit Indian Aadhaar number preserving last 4 digits."""
    digits = "".join(ch for ch in str(aadhaar or "") if ch.isdigit())
    if len(digits) < 4:
        return "XXXX-XXXX-XXXX"
    return f"XXXX-XXXX-{digits[-4:]}"


def _sanitize_string_value(key_lower: str, val: str) -> str:
    if key_lower in SENSITIVE_REDACT_KEYS or any(k in key_lower for k in ("password", "otp", "cvv", "pin", "secret")):
        return "[REDACTED]"
    if key_lower in AADHAAR_KEYS or "aadhaar" in key_lower:
        return mask_aadhaar(val)
    if key_lower in CARD_KEYS or "card" in key_lower:
        return mask_card(val)
    if key_lower in PHONE_KEYS or "phone" in key_lower or "mobile" in key_lower:
        return mask_phone(val)
    if key_lower in NAME_KEYS or "name" in key_lower:
        return mask_name(val)
    return val


def _sanitize_dict_entry(key: str, val: Any) -> Tuple[str, Any]:
    key_lower = str(key).lower().strip()
    if key_lower in SENSITIVE_REDACT_KEYS or any(k in key_lower for k in ("password", "otp", "cvv", "pin", "secret", "auth_token")):
        return key, "[REDACTED]"
    if key_lower in AADHAAR_KEYS or "aadhaar" in key_lower:
        return key, mask_aadhaar(str(val)) if val is not None else None
    if key_lower in CARD_KEYS or "card" in key_lower:
        return key, mask_card(str(val)) if val is not None else None
    if key_lower in PHONE_KEYS or "phone" in key_lower or "mobile" in key_lower:
        return key, mask_phone(str(val)) if val is not None else None
    if key_lower in NAME_KEYS or "name" in key_lower:
        return key, mask_name(str(val)) if val is not None else None
    if isinstance(val, str):
        return key, _sanitize_string_value(key_lower, val)
    return key, sanitize_payload(val)


def sanitize_payload(payload: Any) -> Any:
    """Recursively scrub sensitive fields from dictionaries, lists, or nested structures."""
    if isinstance(payload, dict):
        return dict(_sanitize_dict_entry(k, v) for k, v in payload.items())
    if isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    if isinstance(payload, tuple):
        return tuple(sanitize_payload(item) for item in payload)
    if hasattr(payload, "model_dump") and callable(payload.model_dump):
        return sanitize_payload(payload.model_dump())
    if hasattr(payload, "dict") and callable(payload.dict):
        return sanitize_payload(payload.dict())
    return payload


recursive_payload_sanitizer = sanitize_payload
