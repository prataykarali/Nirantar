"""Operator Command Center snapshot — the control loop, not a generic dashboard."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class LiveSystemState(BaseModel):
    concurrent_users: int = 0
    requests_per_sec: float = 0.0
    cpu_percent: float = 0.0
    latency_ms: float = 0.0
    error_rate_pct: float = 0.0


class ForecastState(BaseModel):
    current_users: int = 0
    plus_5_min_users: int = 0
    plus_10_min_users: int = 0
    safe_capacity_users: int = 0
    overload_predicted: bool = False
    overload_in_seconds: Optional[int] = None


class SecurityState(BaseModel):
    legitimate: int = 0
    suspicious: int = 0
    blocked: int = 0
    throttled: int = 0


class GraphNodeState(BaseModel):
    id: str
    label: str
    health: float = 1.0
    status: str = "healthy"


class RecommendedAction(BaseModel):
    id: str
    label: str
    active: bool = False


class TimelineEvent(BaseModel):
    at: str
    label: str
    kind: str = "info"


class CommandCenterSnapshot(BaseModel):
    live: LiveSystemState = Field(default_factory=LiveSystemState)
    forecast: ForecastState = Field(default_factory=ForecastState)
    security: SecurityState = Field(default_factory=SecurityState)
    nodes: List[GraphNodeState] = Field(default_factory=list)
    bottleneck: str = ""
    bottleneck_detail: str = ""
    actions: List[RecommendedAction] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    dhara_state: str = "NORMAL"
    scenario: str = "NORMAL"
    prayog_users: int = 0
