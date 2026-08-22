"""
NIRANTAR Module 2 — Synthetic Telemetry Dataset Generator
==========================================================
Generates realistic simulated telemetry datasets across 4 critical failure domains:
Normal Traffic, Tatkal Rush Surge, Scalper Bot Attack, and Database Lock Cascade.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple
import numpy as np
from contracts.telemetry import TelemetryEvent
from ml.features.telemetry import TelemetryFeatureEngine, FEATURE_NAMES


class SyntheticTelemetryDatasetGenerator:
    """Generates synthetic telemetry matrices with ground truth labels for ML training."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = np.random.default_rng(seed)
        self.feature_engine = TelemetryFeatureEngine()

    def generate_scenario_events(
        self,
        scenario: str,
        n_samples: int = 200,
        service_name: str = "BookingEngine",
    ) -> List[TelemetryEvent]:
        """Generate time-series telemetry events for a specific scenario."""
        events: List[TelemetryEvent] = []
        base_time = datetime.now(timezone.utc) - timedelta(minutes=n_samples)

        for i in range(n_samples):
            timestamp = (base_time + timedelta(minutes=i)).isoformat()

            if scenario == "NORMAL":
                users = int(self.rng.normal(3500, 400))
                rps = float(self.rng.normal(450, 50))
                cpu = float(np.clip(self.rng.normal(35.0, 5.0), 10.0, 60.0))
                ram = float(np.clip(self.rng.normal(42.0, 3.0), 20.0, 60.0))
                p50 = float(np.clip(self.rng.normal(45.0, 5.0), 20.0, 80.0))
                p99 = float(np.clip(self.rng.normal(85.0, 10.0), 40.0, 150.0))
                error = float(np.clip(self.rng.exponential(0.001), 0.0, 0.01))
                queue = int(max(0, self.rng.normal(5, 2)))
                throughput = float(rps * 0.99)

            elif scenario == "TATKAL_SURGE":
                # Ramp up exponential surge
                progress = min(1.0, i / max(1, n_samples * 0.6))
                users = int(self.rng.normal(8000 + 40000 * progress, 2000))
                rps = float(self.rng.normal(1200 + 8000 * progress, 500))
                cpu = float(np.clip(60.0 + 38.0 * progress + self.rng.normal(0, 2), 40.0, 99.5))
                ram = float(np.clip(55.0 + 35.0 * progress + self.rng.normal(0, 2), 40.0, 95.0))
                p50 = float(np.clip(120.0 + 600.0 * progress, 50.0, 1200.0))
                p99 = float(np.clip(300.0 + 1800.0 * progress, 150.0, 3500.0))
                error = float(np.clip(0.005 + 0.12 * progress, 0.0, 0.25))
                queue = int(max(0, 50 + 1500 * progress + self.rng.normal(0, 100)))
                throughput = float(min(rps, 2500.0))

            elif scenario == "BOT_ATTACK":
                users = int(self.rng.normal(2000, 300))  # Few masked users
                rps = float(self.rng.normal(14000, 1000))  # Massive request frequency (anomalous rps/user)
                cpu = float(np.clip(self.rng.normal(88.0, 4.0), 60.0, 98.0))
                ram = float(np.clip(self.rng.normal(65.0, 4.0), 40.0, 85.0))
                p50 = float(np.clip(self.rng.normal(350.0, 30.0), 100.0, 800.0))
                p99 = float(np.clip(self.rng.normal(1100.0, 150.0), 400.0, 2500.0))
                error = float(np.clip(self.rng.normal(0.08, 0.02), 0.01, 0.20))
                queue = int(max(0, self.rng.normal(450, 50)))
                throughput = float(self.rng.normal(2200, 200))

            elif scenario == "DATABASE_LOCK":
                users = int(self.rng.normal(4000, 500))
                rps = float(self.rng.normal(600, 80))
                cpu = float(np.clip(self.rng.normal(78.0, 6.0), 50.0, 95.0))
                ram = float(np.clip(self.rng.normal(92.0, 3.0), 80.0, 99.0))  # RAM explosion
                p50 = float(np.clip(self.rng.normal(850.0, 100.0), 400.0, 2000.0))
                p99 = float(np.clip(self.rng.normal(3200.0, 300.0), 1800.0, 5000.0))  # Latency explosion
                error = float(np.clip(self.rng.normal(0.22, 0.05), 0.05, 0.50))
                queue = int(max(0, self.rng.normal(2200, 200)))
                throughput = float(self.rng.normal(180, 40))  # Stalled throughput

            else:
                users, rps, cpu, ram, p50, p99, error, queue, throughput = (
                    3000, 300.0, 30.0, 40.0, 40.0, 80.0, 0.001, 0, 300.0
                )

            events.append(TelemetryEvent(
                service_name=service_name,
                timestamp=timestamp,
                requests_per_sec=round(rps, 2),
                concurrent_users=max(1, users),
                cpu_percent=round(cpu, 2),
                ram_percent=round(ram, 2),
                network_mbps=round(rps * 0.08, 2),
                latency_p50_ms=round(p50, 2),
                latency_p99_ms=round(p99, 2),
                error_rate=round(error, 4),
                queue_length=queue,
                throughput_rps=round(throughput, 2),
            ))

        return events

    def generate_full_training_dataset(
        self,
        samples_per_scenario: int = 250,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
        """
        Builds full training dataset with multi-task targets:
        - X: Feature matrix (15 dimensions)
        - y_overload: Binary label (1 if overloaded / abnormal, 0 if normal)
        - y_multi_target: [Target CPU %, Target Latency ms, Target Throughput, Target Error]
        """
        all_events = []
        labels_overload = []
        labels_multi = []

        scenarios = [
            ("NORMAL", 0),
            ("TATKAL_SURGE", 1),
            ("BOT_ATTACK", 1),
            ("DATABASE_LOCK", 1),
        ]

        for sc_name, is_overload in scenarios:
            evs = self.generate_scenario_events(sc_name, samples_per_scenario)
            for ev in evs:
                all_events.append(ev)
                labels_overload.append(is_overload)
                labels_multi.append([
                    ev.cpu_percent,
                    ev.latency_p99_ms,
                    ev.throughput_rps,
                    ev.error_rate,
                ])

        X = self.feature_engine.batch_extract(all_events)
        y_overload = np.array(labels_overload, dtype=np.int32)
        y_multi_target = np.array(labels_multi, dtype=np.float32)

        return X, y_overload, y_multi_target, FEATURE_NAMES
