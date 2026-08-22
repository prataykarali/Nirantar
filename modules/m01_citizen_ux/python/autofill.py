"""
NIRANTAR Module 1 — Safe Autofill Engine & Zero-PII Boundary Filter
====================================================================
Filters form and autofill payloads to ensure only allowlisted non-sensitive
fields (e.g. Name, Age, Gender, Berths, Quota, Origin, Destination) are processed,
while strictly rejecting sensitive forbidden fields (e.g. Passwords, OTPs, CVVs, PINs, Aadhaar).
"""

from typing import Any, Dict, List, Set
from contracts.citizen import SafeAutofillPayload


class SafeAutofillEngine:
    """Zero-PII Safe Autofill Processor."""

    ALLOWED_FIELD_NAMES: Set[str] = {
        "name",
        "age",
        "gender",
        "berths",
        "quota",
        "origin",
        "destination",
        "source_station",
        "destination_station",
        "class_preference",
        "travel_date",
        "passenger_count",
        "time_preference",
    }

    FORBIDDEN_KEYWORDS: Set[str] = {
        "password",
        "passwords",
        "otp",
        "otps",
        "cvv",
        "cvvs",
        "pin",
        "pins",
        "aadhaar",
        "card_number",
        "card",
        "auth_token",
        "token",
        "secret",
        "credit_card",
    }

    def prepare_autofill(self, raw_data: Dict[str, Any]) -> SafeAutofillPayload:
        """Sanitize raw autofill dictionary against Zero-PII safety rules."""
        safe_data: Dict[str, Any] = {}
        filtered_out: List[str] = []

        for key, value in raw_data.items():
            normalized_key = str(key).strip().lower()

            # Check if key contains or matches any forbidden keyword
            is_forbidden = any(
                forbidden in normalized_key for forbidden in self.FORBIDDEN_KEYWORDS
            )

            is_allowed = normalized_key in self.ALLOWED_FIELD_NAMES or any(
                allowed in normalized_key for allowed in self.ALLOWED_FIELD_NAMES
            )

            if is_forbidden or not is_allowed:
                filtered_out.append(key)
            else:
                safe_data[key] = value

        return SafeAutofillPayload(
            allowed_fields=["Name", "Age", "Gender", "Berths", "Quota", "Origin", "Destination"],
            forbidden_fields=["Passwords", "OTPs", "CVVs", "PINs", "Aadhaar"],
            safe_data=safe_data,
            filtered_out_fields=filtered_out,
        )
