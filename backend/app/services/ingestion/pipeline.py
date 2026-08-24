"""
Railway information ingestion pipeline.

Scrapling → Parser → Normalizer → Validation → Cache → Backend

Scrapling only obtains permitted public information.
The source adapter is replaceable by an official API.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .cache import cache_key, cache_stats, get_cached, set_cached
from .normalizer import DISCLAIMER, normalize_records
from .parser import parse_documents
from .sources import SeedPublicSource, get_railway_source
from .validator import validate_records


def ingest_railway_information(query: str = "", force_refresh: bool = False) -> Dict[str, Any]:
    source = get_railway_source()
    key = cache_key(query, source.name)
    if not force_refresh:
        cached = get_cached(key)
        if cached:
            cached = dict(cached)
            cached["fromCache"] = True
            return cached

    raw_docs = []
    try:
        raw_docs = source.obtain(query)
    except Exception:
        raw_docs = []

    used_source = source.name
    if not raw_docs:
        raw_docs = SeedPublicSource().obtain(query)
        used_source = "seed"

    parsed = parse_documents(raw_docs)
    normalized = normalize_records(parsed)
    accepted, rejected = validate_records(normalized)

    if not accepted:
        seed_parsed = parse_documents(SeedPublicSource().obtain(query))
        accepted, extra_rejected = validate_records(normalize_records(seed_parsed))
        rejected.extend(extra_rejected)
        used_source = "seed"

    payload = {
        "status": 200,
        "source": used_source,
        "replaceableBy": "official_api",
        "disclaimer": DISCLAIMER,
        "records": accepted,
        "rejected": rejected,
        "fromCache": False,
        "cache": cache_stats(),
    }
    set_cached(key, payload)
    return payload


def get_cached_public_info(query: str = "") -> Optional[Dict[str, Any]]:
    source = get_railway_source()
    return get_cached(cache_key(query, source.name))


def public_notices_for_route(origin: str = "", destination: str = "") -> List[Dict[str, Any]]:
    """Attach cached/seed public notices without blocking the journey on live fetch."""
    query = f"{origin} {destination}".strip()
    payload = get_cached_public_info(query) or get_cached_public_info("")
    if not payload:
        seed_parsed = parse_documents(SeedPublicSource().obtain(query))
        accepted, _ = validate_records(normalize_records(seed_parsed))
        payload = {"records": accepted}
    records = payload.get("records") or []
    codes = {origin.upper(), destination.upper()} - {""}
    if not codes:
        return records[:3]
    matched = [
        rec for rec in records
        if codes.intersection(set(rec.get("stationsMentioned") or []))
    ]
    return (matched or records)[:3]
