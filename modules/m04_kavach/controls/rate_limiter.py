"""
KAVACH — In-memory sliding-window rate limiter (local-first, no Redis required).
Enforces multi-tier RPS limits:
- Human tier: 10.0 rps
- Challenge tier: 2.0 rps
- High-risk/bot tier: 0.5 rps
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple


# Standard Multi-tier RPS Constants
RPS_HUMAN: float = 10.0
RPS_CHALLENGE: float = 2.0
RPS_HIGH_RISK: float = 0.5


class SessionRateLimiter:
    """Sliding-window rate limiter enforcing multi-tier RPS limits per session."""

    def __init__(self) -> None:
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, session_id: str, max_rps: float = RPS_HUMAN) -> Tuple[bool, int]:
        """
        Evaluate whether a request is allowed under the sliding window limit for the given session.
        Returns: (allowed: bool, remaining_capacity: int)
        """
        now = time.time()
        window = self._hits[session_id]

        if max_rps < 1.0:
            min_gap = 1.0 / max(max_rps, 0.05)
            # Prune timestamps older than min_gap
            while window and now - window[0] > min_gap:
                window.popleft()
            if window and (now - window[-1]) < min_gap:
                return False, 0
            window.append(now)
            return True, 0
        else:
            # 1.0 second sliding window for max_rps >= 1.0
            while window and now - window[0] > 1.0:
                window.popleft()
            cap = max(int(max_rps), 1)
            if len(window) >= cap:
                return False, 0
            window.append(now)
            return True, cap - len(window)

    def reset_session(self, session_id: str) -> None:
        """Clear rate limit history for a session."""
        if session_id in self._hits:
            del self._hits[session_id]

    def clear(self) -> None:
        """Reset all rate limit tracking history."""
        self._hits.clear()
