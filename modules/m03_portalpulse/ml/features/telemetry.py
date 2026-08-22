"""
NIRANTAR Module 2 — Telemetry Feature Engineering Pipeline
==========================================================
Extracts tabular feature vectors and interaction ratios from raw TelemetryEvents.
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from contracts.telemetry import TelemetryEvent, DerivedTelemetryFeatures


FEATURE_NAMES = [
    "requests_per_sec",
    "concurrent_users",
    "cpu_percent",
    "ram_percent",
    "network_mbps",
    "latency_p50_ms",
    "latency_p99_ms",
    "error_rate",
    "queue_length",
    "throughput_rps",
    "users_per_cpu",
    "requests_per_user",
    "queue_pressure_index",
    "latency_growth_rate",
    "cpu_growth_rate",
]


class TelemetryFeatureEngine:
    """Transforms raw microservice telemetry into ML-ready feature matrices."""

    def __init__(self) -> None:
        self.history: Dict[str, List[TelemetryEvent]] = {}

    def extract_features(self, event: TelemetryEvent) -> Tuple[np.ndarray, DerivedTelemetryFeatures]:
        """Convert a single TelemetryEvent into a 15-dimensional numeric feature vector."""
        svc = event.service_name
        if svc not in self.history:
            self.history[svc] = []

        self.history[svc].append(event)
        if len(self.history[svc]) > 20:
            self.history[svc].pop(0)

        # 1. Ratios and interaction terms
        users_per_cpu = float(event.concurrent_users) / max(event.cpu_percent, 1.0)
        requests_per_user = float(event.requests_per_sec) / max(event.concurrent_users, 1.0)
        queue_pressure = (float(event.queue_length) * max(event.latency_p99_ms, 1.0)) / max(event.throughput_rps, 1.0)

        # 2. Historical growth rates (Delta from last event)
        latency_growth = 0.0
        cpu_growth = 0.0
        if len(self.history[svc]) >= 2:
            prev = self.history[svc][-2]
            latency_growth = (event.latency_p99_ms - prev.latency_p99_ms) / max(prev.latency_p99_ms, 1.0)
            cpu_growth = (event.cpu_percent - prev.cpu_percent) / max(prev.cpu_percent, 1.0)

        derived = DerivedTelemetryFeatures(
            service_name=event.service_name,
            timestamp=event.timestamp,
            users_per_cpu=round(users_per_cpu, 2),
            requests_per_user=round(requests_per_user, 3),
            latency_growth_rate=round(latency_growth, 3),
            cpu_growth_rate=round(cpu_growth, 3),
            rolling_rps_5m=round(event.requests_per_sec, 2),
            rolling_latency_5m=round(event.latency_p99_ms, 2),
            error_surge_delta=round(event.error_rate, 4),
            queue_pressure_index=round(queue_pressure, 2),
        )

        vector = np.array([
            event.requests_per_sec,
            float(event.concurrent_users),
            event.cpu_percent,
            event.ram_percent,
            event.network_mbps,
            event.latency_p50_ms,
            event.latency_p99_ms,
            event.error_rate,
            float(event.queue_length),
            event.throughput_rps,
            users_per_cpu,
            requests_per_user,
            queue_pressure,
            latency_growth,
            cpu_growth,
        ], dtype=np.float32)

        return vector, derived

    def batch_extract(self, events: List[TelemetryEvent]) -> np.ndarray:
        """Extract feature matrix for a batch of events."""
        vectors = [self.extract_features(e)[0] for e in events]
        return np.vstack(vectors) if vectors else np.empty((0, len(FEATURE_NAMES)), dtype=np.float32)
