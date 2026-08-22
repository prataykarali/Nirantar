"""
PRAYOG — Locust harness for 1K / 5K / 10K virtual citizens.

Usage:
    locust -f loadtest/locustfile.py --headless -u 1000 -r 50 -t 60s --host http://localhost:8000
    PRAYOG_SCENARIO=D locust -f loadtest/locustfile.py --host http://localhost:8000
    locust -f loadtest/locustfile.py --master
    locust -f loadtest/locustfile.py --worker --master-host=127.0.0.1
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from locust import LoadTestShape

from loadtest.users.personas import (  # noqa: F401
    AbandonedUser,
    NormalCitizenUser,
    RetryHeavyUser,
    ReturningUser,
    SearchHeavyUser,
    SlowMobileUser,
    SuspiciousUser,
)

# Backward-compatible aliases for older docs / commands.
CitizenUser = NormalCitizenUser
AggressiveBotUser = SuspiciousUser

_SCENARIO = os.getenv("PRAYOG_SCENARIO", "").strip().upper()

if _SCENARIO in {"E", "BOT_SURGE"}:
    SuspiciousUser.weight = 20
    NormalCitizenUser.weight = 44
    SearchHeavyUser.weight = 12
    ReturningUser.weight = 8
    SlowMobileUser.weight = 6
    RetryHeavyUser.weight = 4
    AbandonedUser.weight = 2

_SPIKE_STAGES = (
    (20, 500, 50),
    (40, 2000, 100),
    (60, 5000, 150),
    (100, 10000, 200),
)


if _SCENARIO in {"D", "SUDDEN_SPIKE"}:

    class SuddenSpikeShape(LoadTestShape):
        """500 → 2,000 → 5,000 → 10,000 concurrent virtual users."""

        def tick(self):  # type: ignore[override]
            run_time = self.get_run_time()
            for duration, users, spawn in _SPIKE_STAGES:
                if run_time < duration:
                    return users, spawn
            return None
