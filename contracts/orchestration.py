"""
NIRANTAR Contracts — Orchestration, Queues & Resilience Schemas
===============================================================
Owned by Agent 3 (FORGE / Orchestrator / DHARA), bridging ML predictions to system actions.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class ResilienceState(str, Enum):
    NORMAL = "NORMAL"
    ELEVATED_MONITORING = "ELEVATED_MONITORING"
    QUEUE_ACTIVATED = "QUEUE_ACTIVATED"
    LOAD_SHEDDING = "LOAD_SHEDDING"
    CIRCUIT_TRIPPED = "CIRCUIT_TRIPPED"
    EMERGENCY_DEGRADED = "EMERGENCY_DEGRADED"


class QueuePolicy(str, Enum):
    FIFO = "FIFO"
    PRIORITY_FAIR = "PRIORITY_FAIR"
    ADMISSION_CONTROLLED = "ADMISSION_CONTROLLED"


class QueueAction(BaseModel):
    """Queue admission control action."""
    queue_name: str = "booking_admission_queue"
    policy: QueuePolicy = QueuePolicy.PRIORITY_FAIR
    should_enqueue: bool = False
    priority_level: int = 1  # 1 = highest
    max_queue_depth: int = 10000
    target_service: str = "BookingEngine"


class LoadShedAction(BaseModel):
    """Graceful degradation directive."""
    shed_non_critical: bool = False
    drop_unauthenticated: bool = False
    serve_cached_inventory: bool = False
    disabled_features: List[str] = Field(default_factory=list)


class RateLimitAction(BaseModel):
    """Adaptive rate limiting directive."""
    global_rate_multiplier: float = Field(default=1.0, ge=0.1, le=1.0)
    per_ip_limit_rps: int = 20
    suspicious_bucket_rps: int = 2


class OrchestrationDecision(BaseModel):
    """Deterministic system action decided by the Orchestration Engine."""
    decision_id: str = Field(default_factory=lambda: f"ORC-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    target_service: str = "BookingEngine"
    current_state: ResilienceState = ResilienceState.NORMAL
    trigger_reason: str = "Normal daytime operational bounds"
    queue: QueueAction = Field(default_factory=QueueAction)
    load_shed: LoadShedAction = Field(default_factory=LoadShedAction)
    rate_limit: RateLimitAction = Field(default_factory=RateLimitAction)
    database_protection_enabled: bool = False
    cache_ttl_seconds: int = 30
