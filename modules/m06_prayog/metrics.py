"""
PRAYOG Telemetry & Metrics Tracking Module.

Tracks:
- Queue depth
- p95 latency (ms)
- Throughput (RPS)
- Bot mitigation rate (%)
- Legitimate citizen success rate (%)
"""

from __future__ import annotations

import numpy as np
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TelemetrySnapshot(BaseModel):
    queue_depth: int = 0
    p95_latency_ms: float = 0.0
    throughput_rps: float = 0.0
    bot_mitigation_rate: float = 1.0
    legit_success_rate: float = 1.0
    total_requests: int = 0
    total_bots_detected: int = 0
    total_bots_throttled: int = 0


class SimulationMetricsTracker:
    """Telemetry collector for PRAYOG simulation runs."""

    def __init__(self) -> None:
        self._queue_depth: int = 0
        self._latencies_ms: List[float] = []
        self._total_requests: int = 0
        self._bots_detected: int = 0
        self._bots_throttled: int = 0
        self._legit_total: int = 0
        self._legit_success: int = 0
        self._duration_seconds: float = 60.0
        self._history: List[TelemetrySnapshot] = []

    def reset(self) -> None:
        self._queue_depth = 0
        self._latencies_ms.clear()
        self._total_requests = 0
        self._bots_detected = 0
        self._bots_throttled = 0
        self._legit_total = 0
        self._legit_success = 0
        self._duration_seconds = 60.0

    def record_request(
        self,
        latency_ms: float,
        is_bot: bool = False,
        bot_throttled: bool = False,
        legit_success: bool = True,
        enqueued: bool = False,
    ) -> None:
        self._total_requests += 1
        self._latencies_ms.append(max(1.0, latency_ms))
        if enqueued:
            self._queue_depth += 1
        if is_bot:
            self._bots_detected += 1
            if bot_throttled:
                self._bots_throttled += 1
        else:
            self._legit_total += 1
            if legit_success:
                self._legit_success += 1

    def update_from_run(
        self,
        simulated_users: int,
        queue_depth: int,
        outcomes: Dict[str, int],
        duration_s: float = 60.0,
        overload_prob: float = 0.0,
        db_slow: bool = False,
    ) -> TelemetrySnapshot:
        self._duration_seconds = max(1.0, duration_s)
        self._queue_depth = queue_depth
        self._total_requests = simulated_users * 5  # Avg 5 steps per citizen

        base_lat = 45.0 + (overload_prob * 180.0)
        if db_slow:
            base_lat *= 3.5

        # Generate realistic latency sample based on overload
        raw_latencies = np.random.normal(loc=base_lat, scale=base_lat * 0.25, size=max(10, simulated_users))
        self._latencies_ms = [float(max(5.0, l)) for l in raw_latencies]

        throttled = outcomes.get("throttled", 0)
        suspicious = outcomes.get("suspicious", 0) + throttled
        completed = outcomes.get("completed", 0)
        queued = outcomes.get("queued", 0)
        dropped = outcomes.get("dropped", 0) + outcomes.get("failed_chaos", 0)

        self._bots_detected = max(throttled, suspicious)
        self._bots_throttled = throttled

        legit_total = max(1, completed + queued + dropped)
        self._legit_total = legit_total
        self._legit_success = completed + queued

        snapshot = self.get_snapshot()
        self._history.append(snapshot)
        return snapshot

    def get_snapshot(self) -> TelemetrySnapshot:
        if self._latencies_ms:
            p95 = float(np.percentile(self._latencies_ms, 95))
        else:
            p95 = 45.0

        rps = round(self._total_requests / self._duration_seconds, 2)

        if self._bots_detected > 0:
            bot_rate = round(min(1.0, self._bots_throttled / self._bots_detected), 4)
        else:
            bot_rate = 1.0

        if self._legit_total > 0:
            legit_rate = round(min(1.0, self._legit_success / self._legit_total), 4)
        else:
            legit_rate = 1.0

        return TelemetrySnapshot(
            queue_depth=self._queue_depth,
            p95_latency_ms=round(p95, 2),
            throughput_rps=rps,
            bot_mitigation_rate=bot_rate,
            legit_success_rate=legit_rate,
            total_requests=self._total_requests,
            total_bots_detected=self._bots_detected,
            total_bots_throttled=self._bots_throttled,
        )

    def get_history(self) -> List[Dict[str, Any]]:
        return [s.model_dump() for s in self._history]


# Shared singleton instance for simulation metrics
telemetry_tracker = SimulationMetricsTracker()
