"""
NIRANTAR Module 0 — Real-time Telemetry Generator
=================================================
High-fidelity telemetry emitter generating synthetic workload signatures
(Idle, Normal Daytime, Tatkal Rush, Bot Attack, Backend Failure).
Feeds real-time telemetry streams to M2 (Predictive Intelligence) and M4 (Resilience).
"""

import math
import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Generator, List, Optional
from .database import DigitalTwinDatabase, get_db
from .models import TelemetryMetric


class SimulationScenario(str, Enum):
    IDLE = "IDLE"
    NORMAL_DAYTIME = "NORMAL_DAYTIME"
    TATKAL_RUSH = "TATKAL_RUSH"
    BOT_ATTACK = "BOT_ATTACK"
    BACKEND_FAILURE = "BACKEND_FAILURE"


@dataclass
class TelemetryProfile:
    """Statistical bounds defining a workload signature."""
    base_rps: float
    peak_rps: float
    base_concurrent: int
    base_cpu: float
    base_ram: float
    base_latency_p50: float
    base_latency_p99: float
    base_error_rate: float
    queue_backlog: int


PROFILES: Dict[SimulationScenario, TelemetryProfile] = {
    SimulationScenario.IDLE: TelemetryProfile(
        base_rps=8.0,
        peak_rps=15.0,
        base_concurrent=120,
        base_cpu=12.0,
        base_ram=22.0,
        base_latency_p50=8.0,
        base_latency_p99=18.0,
        base_error_rate=0.001,
        queue_backlog=0,
    ),
    SimulationScenario.NORMAL_DAYTIME: TelemetryProfile(
        base_rps=85.0,
        peak_rps=150.0,
        base_concurrent=3200,
        base_cpu=38.0,
        base_ram=45.0,
        base_latency_p50=22.0,
        base_latency_p99=65.0,
        base_error_rate=0.005,
        queue_backlog=4,
    ),
    SimulationScenario.TATKAL_RUSH: TelemetryProfile(
        base_rps=8500.0,
        peak_rps=18500.0,
        base_concurrent=150000,
        base_cpu=94.0,
        base_ram=88.0,
        base_latency_p50=320.0,
        base_latency_p99=1250.0,
        base_error_rate=0.14,
        queue_backlog=1850,
    ),
    SimulationScenario.BOT_ATTACK: TelemetryProfile(
        base_rps=12000.0,
        peak_rps=25000.0,
        base_concurrent=85000,
        base_cpu=98.0,
        base_ram=82.0,
        base_latency_p50=480.0,
        base_latency_p99=2100.0,
        base_error_rate=0.42,
        queue_backlog=4200,
    ),
    SimulationScenario.BACKEND_FAILURE: TelemetryProfile(
        base_rps=220.0,
        peak_rps=400.0,
        base_concurrent=25000,
        base_cpu=89.0,
        base_ram=92.0,
        base_latency_p50=1800.0,
        base_latency_p99=4500.0,
        base_error_rate=0.68,
        queue_backlog=8900,
    ),
}


class TelemetryEmitter:
    """Real-time multi-service telemetry generator and persistence buffer."""

    DEFAULT_SERVICES = [
        "BookingEngine",
        "SearchService",
        "AvailabilityService",
        "AuthService",
        "SeatInventoryDB",
        "PaymentGateway",
    ]

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self.current_scenario: SimulationScenario = SimulationScenario.NORMAL_DAYTIME
        self._history: List[TelemetryMetric] = []

    def set_scenario(self, scenario: SimulationScenario) -> None:
        """Switch the current simulation workload scenario."""
        self.current_scenario = scenario

    def generate_point(self, service_name: str, tick: int = 0) -> TelemetryMetric:
        """Generate a single telemetry metric point for a service."""
        prof = PROFILES[self.current_scenario]
        noise = random.uniform(-0.08, 0.08)
        time_factor = (math.sin(tick * 0.1) + 1.0) / 2.0  # Wave modulation

        rps = max(1.0, prof.base_rps + (prof.peak_rps - prof.base_rps) * time_factor * (1.0 + noise))
        concurrent = int(prof.base_concurrent * (1.0 + noise * 0.5))
        cpu = min(100.0, max(5.0, prof.base_cpu + (prof.base_cpu * 0.3 * time_factor) + (noise * 10.0)))
        ram = min(100.0, max(10.0, prof.base_ram + (noise * 5.0)))
        lat_p50 = max(2.0, prof.base_latency_p50 * (1.0 + noise))
        lat_p99 = max(lat_p50 * 1.5, prof.base_latency_p99 * (1.0 + noise * 1.2))
        err_rate = min(1.0, max(0.0, prof.base_error_rate + (noise * 0.01)))
        queue = max(0, int(prof.queue_backlog * (1.0 + noise)))
        throughput = max(0.0, rps * (1.0 - err_rate))
        net_mbps = round((rps * 1.8) / 1024.0, 2)

        metric = TelemetryMetric(
            service_name=service_name,
            timestamp=datetime.now(timezone.utc).isoformat(),
            requests_per_sec=round(rps, 2),
            concurrent_users=concurrent,
            cpu_percent=round(cpu, 2),
            ram_percent=round(ram, 2),
            network_mbps=net_mbps,
            latency_p50_ms=round(lat_p50, 2),
            latency_p99_ms=round(lat_p99, 2),
            error_rate=round(err_rate, 4),
            queue_length=queue,
            throughput_rps=round(throughput, 2),
        )

        self._history.append(metric)
        self.db.insert_telemetry(metric)
        return metric

    def emit_snapshot(self, tick: int = 0) -> List[TelemetryMetric]:
        """Emit current snapshot for all default microservices."""
        return [self.generate_point(svc, tick) for svc in self.DEFAULT_SERVICES]

    def stream_telemetry(
        self, ticks: int = 10, interval_sec: float = 0.1
    ) -> Generator[List[TelemetryMetric], None, None]:
        """Yield real-time snapshots over time."""
        for t in range(ticks):
            snapshot = self.emit_snapshot(t)
            yield snapshot
            if interval_sec > 0:
                time.sleep(interval_sec)

    def generate_synthetic_dataset(
        self, scenario: SimulationScenario, duration_ticks: int = 60
    ) -> List[TelemetryMetric]:
        """Generate a complete historical telemetry training dataset for M2."""
        prev = self.current_scenario
        self.set_scenario(scenario)
        dataset: List[TelemetryMetric] = []
        for t in range(duration_ticks):
            dataset.extend(self.emit_snapshot(t))
        self.set_scenario(prev)
        return dataset
