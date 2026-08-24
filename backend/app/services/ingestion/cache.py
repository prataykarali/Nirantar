"""TTL cache for permitted public railway information."""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional, Tuple

_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}


def _ttl_seconds() -> int:
    hours = float(os.getenv("SCRAPLING_CACHE_TTL_HOURS", "24"))
    return max(60, int(hours * 3600))


def cache_key(query: str, source_name: str) -> str:
    return f"{source_name}::{(query or '').strip().lower()}"


def get_cached(key: str) -> Optional[Dict[str, Any]]:
    entry = _CACHE.get(key)
    if not entry:
        return None
    expires_at, payload = entry
    if time.time() > expires_at:
        _CACHE.pop(key, None)
        return None
    return payload


def set_cached(key: str, payload: Dict[str, Any]) -> None:
    _CACHE[key] = (time.time() + _ttl_seconds(), payload)


def cache_stats() -> Dict[str, Any]:
    now = time.time()
    live = sum(1 for exp, _ in _CACHE.values() if exp > now)
    return {"entries": live, "ttlSeconds": _ttl_seconds()}
