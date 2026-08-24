"""Normalize parsed fragments into a stable public-info record shape."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Dict, List

DISCLAIMER = (
    "Permitted public information for the Nirantar prototype. "
    "This is not live IRCTC inventory and is not connected to real railway booking infrastructure."
)


def normalize_records(parsed: List[Dict]) -> List[Dict]:
    now = datetime.now(timezone.utc).isoformat()
    records: List[Dict] = []
    for item in parsed:
        record_id = hashlib.sha256(
            f"{item.get('url', '')}|{item.get('title', '')}".encode("utf-8")
        ).hexdigest()[:16]
        records.append(
            {
                "recordId": record_id,
                "sourceId": item.get("source_id"),
                "sourceUrl": item.get("url"),
                "title": item.get("title"),
                "summary": item.get("summary"),
                "category": item.get("kind") or "public_notice",
                "stationsMentioned": item.get("stations_mentioned") or [],
                "fetchedAt": now,
                "isLive": bool(item.get("is_live")),
                "disclaimer": DISCLAIMER,
            }
        )
    return records
