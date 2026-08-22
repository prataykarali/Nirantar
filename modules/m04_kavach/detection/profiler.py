"""
KAVACH — Per-session behaviour profiler.
Tracks request frequency, endpoint sequence, retries, and session duration.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Deque, Dict, List


HUMAN_PATH = ("HOME", "SEARCH", "RESULTS", "SELECT", "BOOK")


@dataclass
class SessionProfile:
    session_id: str
    started_at: float = field(default_factory=time.time)
    events: Deque[float] = field(default_factory=deque)
    endpoints: List[str] = field(default_factory=list)
    retries: int = 0

    def request_frequency_per_sec(self, window_seconds: float = 10.0) -> float:
        now = time.time()
        recent = [ts for ts in self.events if now - ts <= window_seconds]
        if not recent:
            return 0.0
        span = max(now - recent[0], 1.0)
        return len(recent) / span

    def session_duration_seconds(self) -> float:
        return max(time.time() - self.started_at, 0.01)

    def navigation_pattern(self) -> str:
        """
        Classify session navigation sequence into HUMAN_PROGRESSIVE, BOT_LIKE_REPEAT, or UNKNOWN.
        """
        if len(self.endpoints) >= 4 and len(set(self.endpoints[-6:])) == 1:
            return "BOT_LIKE_REPEAT"

        if len(self.endpoints) >= 5:
            if self.endpoints.count("SEARCH") >= 5 and "SELECT" not in self.endpoints and "BOOK" not in self.endpoints:
                return "BOT_LIKE_REPEAT"
            if len(set(self.endpoints)) == 1:
                return "BOT_LIKE_REPEAT"

        joined = ">".join(self.endpoints[-5:])
        if any(seq in joined for seq in ("HOME>SEARCH", "SEARCH>SELECT", "SELECT>BOOK", "SEARCH>RESULTS", "RESULTS>SELECT")):
            return "HUMAN_PROGRESSIVE"

        return "UNKNOWN"


class SessionProfiler:
    """In-memory profiler. Zero PII — session_id is already a synthetic token."""

    def __init__(self) -> None:
        self._sessions: Dict[str, SessionProfile] = defaultdict(
            lambda: SessionProfile(session_id="unknown")
        )

    def record(self, session_id: str, endpoint: str, is_retry: bool = False) -> SessionProfile:
        profile = self._sessions.get(session_id)
        if profile is None or profile.session_id == "unknown":
            profile = SessionProfile(session_id=session_id)
            self._sessions[session_id] = profile
        profile.events.append(time.time())
        if len(profile.events) > 200:
            profile.events.popleft()
        profile.endpoints.append(endpoint)
        if is_retry:
            profile.retries += 1
        return profile

    def get_profile(self, session_id: str) -> SessionProfile:
        return self._sessions[session_id]

    def clear(self) -> None:
        self._sessions.clear()
