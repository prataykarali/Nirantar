"""DHARA — priority admission queue. Critical bookings before search/analytics."""

from __future__ import annotations

import heapq
import itertools
from typing import Any, Dict, List, Optional, Tuple

PRIORITY = {
    "CRITICAL_BOOKING": 1,
    "NORMAL_TRANSACTION": 2,
    "SEARCH": 3,
    "ANALYTICS": 4,
    "BACKGROUND": 5,
}


class AdmissionQueue:
    def __init__(self, max_depth: int = 10000, safe_admission_per_tick: int = 40) -> None:
        self.max_depth = max_depth
        self.safe_admission_per_tick = safe_admission_per_tick
        self._heap: List[Tuple[int, int, Dict[str, Any]]] = []
        self._seq = itertools.count()
        self._admitted = 0

    def classify(self, endpoint: str) -> str:
        lowered = endpoint.lower()
        if "book" in lowered or endpoint in {"PAY", "CONFIRM", "REVIEW", "BOOK"}:
            return "CRITICAL_BOOKING"
        if endpoint in {"SELECT", "PASSENGER"}:
            return "NORMAL_TRANSACTION"
        if endpoint in {"SEARCH", "INTENT", "CONFIRM_INTENT"}:
            return "SEARCH"
        return "BACKGROUND"

    def enqueue(self, session_id: str, endpoint: str) -> Dict[str, Any]:
        category = self.classify(endpoint)
        if len(self._heap) >= self.max_depth:
            return {
                "enqueued": False,
                "reason": "queue_full",
                "category": category,
                "position": None,
            }
        item = {"session_id": session_id, "endpoint": endpoint, "category": category}
        heapq.heappush(self._heap, (PRIORITY[category], next(self._seq), item))
        return {
            "enqueued": True,
            "category": category,
            "position": len(self._heap),
            "priority": PRIORITY[category],
        }

    def admit(self, n: Optional[int] = None) -> List[Dict[str, Any]]:
        batch = n if n is not None else self.safe_admission_per_tick
        out: List[Dict[str, Any]] = []
        for _ in range(min(batch, len(self._heap))):
            _, _, item = heapq.heappop(self._heap)
            out.append(item)
            self._admitted += 1
        return out

    def depth(self) -> int:
        return len(self._heap)
