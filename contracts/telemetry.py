"""
NIRANTAR Contracts — Telemetry & Observability Schemas
======================================================
Owned by Agent 1 (ORBIT) & Agent 5 (SENTINEL / Kavach), ingested by Agent 2 (NOVA).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class TelemetryEvent(BaseModel):
    """Atomic telemetry event emitted by a simulated microservice."""
    event_id: str = Field(default_factory=lambda: f"TEL-{uuid.uuid4().hex[:8].upper()}")
    service_name: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    requests_per_sec: float = Field(default=0.0, ge=0.0)
    concurrent_users: int = Field(default=0, ge=0)
    cpu_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    ram_percent: float = Field(default=0.0, ge=0.0, le=100.0)
    network_mbps: float = Field(default=0.0, ge=0.0)
    latency_p50_ms: float = Field(default=0.0, ge=0.0)
    latency_p99_ms: float = Field(default=0.0, ge=0.0)
    error_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    queue_length: int = Field(default=0, ge=0)
    throughput_rps: float = Field(default=0.0, ge=0.0)
    trace_id: Optional[str] = None


class DerivedTelemetryFeatures(BaseModel):
    """Engineered features for Machine Learning capacity and anomaly models."""
    service_name: str
    timestamp: str
    users_per_cpu: float = 0.0
    requests_per_user: float = 0.0
    latency_growth_rate: float = 0.0
    cpu_growth_rate: float = 0.0
    rolling_rps_5m: float = 0.0
    rolling_latency_5m: float = 0.0
    error_surge_delta: float = 0.0
    queue_pressure_index: float = 0.0


class ServiceMetricsSnapshot(BaseModel):
    """Ecosystem-wide snapshot at a given timestamp."""
    snapshot_id: str = Field(default_factory=lambda: f"SNP-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    services: Dict[str, TelemetryEvent] = Field(default_factory=dict)
    system_load_status: str = "NORMAL"
    total_concurrent_users: int = 0
    total_rps: float = 0.0


class TelemetryBatch(BaseModel):
    """Batch of telemetry events for bulk ingestion and training."""
    batch_id: str = Field(default_factory=lambda: f"BAT-{uuid.uuid4().hex[:8].upper()}")
    events: List[TelemetryEvent] = Field(default_factory=list)
    scenario_label: Optional[str] = None
