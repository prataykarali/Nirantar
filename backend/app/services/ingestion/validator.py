"""Validate normalized public railway records. Reject PII and off-allowlist URLs."""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

from .sources import ALLOWED_URLS

PII_PATTERNS = [
    ("aadhaar", re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")),
    ("pan", re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")),
    ("phone", re.compile(r"\b(?:\+91[\s-]?)?[6-9]\d{9}\b")),
    ("email", re.compile(r"\b[\w.-]+@[\w.-]+\.\w+\b")),
]

REQUIRED = ("recordId", "sourceUrl", "title", "summary", "disclaimer")


def validate_records(records: List[Dict]) -> Tuple[List[Dict], List[str]]:
    accepted: List[Dict] = []
    rejected: List[str] = []
    for record in records:
        reason = _reject_reason(record)
        if reason:
            rejected.append(f"{record.get('recordId')}: {reason}")
            continue
        accepted.append(record)
    return accepted, rejected


def _reject_reason(record: Dict) -> str:
    missing = [key for key in REQUIRED if not record.get(key)]
    if missing:
        return f"missing {', '.join(missing)}"

    url = str(record.get("sourceUrl") or "")
    if url not in ALLOWED_URLS:
        return "source URL is not on the permitted public allowlist"

    blob = f"{record.get('title', '')} {record.get('summary', '')}"
    for label, pattern in PII_PATTERNS:
        if pattern.search(blob):
            return f"possible {label} detected — personal information is not ingested"

    if len(str(record.get("summary"))) < 40:
        return "summary too short to be useful public information"
    return ""
