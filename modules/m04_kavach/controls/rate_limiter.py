"""
KAVACH — In-memory sliding-window rate limiter (local-first, no Redis required).
Normal: 10 rps. Suspicious: 2 rps. High-risk: 0.5 rps.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple


class SessionRateLimiter:
    def __init__(self) -> None:
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, session_id: str, max_rps: float) -> Tuple[bool, int]:
        now = time.time()
        window = self._hits[session_id]
        while window and now - window[0] > 1.0:
            window.popleft()
        cap = max(int(max_rps) if max_rps >= 1 else 1, 1)
        # Sub-1 rps: allow at most one request per 1/max_rps seconds.
        if max_rps < 1:
            min_gap = 1.0 / max(max_rps, 0.1)
            if window and now - window[-1] < min_gap:
                return False, 0
            window.append(now)
            return True, 0
        if len(window) >= cap:
            return False, 0
        window.append(now)
        return True, cap - len(window)
