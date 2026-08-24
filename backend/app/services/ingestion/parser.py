"""Parse raw public pages into structured fragments. No PII extraction."""

from __future__ import annotations

import re
from typing import Dict, List

from .sources import RawDocument

STATION_HINTS = {
    "NDLS": ("new delhi", "ndls", "delhi"),
    "HWH": ("howrah", "kolkata", "hwh"),
    "CSMT": ("mumbai", "csmt", "bombay"),
    "SBC": ("bengaluru", "bangalore", "sbc"),
    "MAS": ("chennai", "madras", "mas"),
    "PURI": ("puri",),
}


def parse_documents(documents: List[RawDocument]) -> List[Dict]:
    parsed: List[Dict] = []
    for doc in documents:
        text = _clean(doc.text)
        if len(text) < 40:
            continue
        parsed.append(
            {
                "source_id": doc.source_id,
                "url": doc.url,
                "title": _clean(doc.title)[:180] or "Public railway information",
                "summary": text[:500],
                "kind": doc.kind,
                "is_live": doc.is_live,
                "stations_mentioned": _stations_in(text),
            }
        )
    return parsed


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def _stations_in(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for code, hints in STATION_HINTS.items():
        if any(hint in lower for hint in hints):
            found.append(code)
    return found
