"""
NIRANTAR Contracts — Predictive Intelligence & ML Schemas
==========================================================
Owned by Agent 2 (NOVA / Intelligence), consumed by Agent 3 (FORGE / Orchestrator).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class ModelType(str, Enum):
    XGBOOST = "XGBOOST"
    LIGHTGBM = "LIGHTGBM"
    PYTORCH_MLP = "PYTORCH_MLP"
    ISOLATION_FOREST = "ISOLATION_FOREST"
    RANDOM_FOREST = "RANDOM_FOREST"


class AnomalyType(str, Enum):
    NONE = "NONE"
    TRAFFIC_SURGE = "TRAFFIC_SURGE"
    DATABASE_LOCK = "DATABASE_LOCK"
    BOT_COORDINATION = "BOT_COORDINATION"
    LATENCY_SPIKE = "LATENCY_SPIKE"
    CASCADING_FAILURE = "CASCADING_FAILURE"


class FeatureImportance(BaseModel):
    """SHAP feature attribution for model explainability."""
    feature_name: str
    shap_value: float
    percentage_contribution: float
    direction: str = "INCREASES_RISK"


class AnomalyDetectionResult(BaseModel):
    """Real-time anomaly evaluation on incoming telemetry."""
    is_anomaly: bool = False
    anomaly_score: float = Field(default=0.0, ge=0.0, le=1.0)
    anomaly_type: AnomalyType = AnomalyType.NONE
    suspect_features: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)


class OverloadForecast(BaseModel):
    """Capacity and bottleneck forecast."""
    target_service: str
    time_to_overload_minutes: Optional[int] = None
    predicted_peak_rps: float = 0.0
    predicted_peak_cpu: float = 0.0
    predicted_peak_latency_ms: float = 0.0
    overload_probability: float = Field(default=0.0, ge=0.0, le=1.0)


class PredictionResult(BaseModel):
    """Unified ML inference result combining multi-output predictions and SHAP explainability."""
    prediction_id: str = Field(default_factory=lambda: f"PRD-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    target_service: str = "BookingEngine"
    model_type: ModelType = ModelType.XGBOOST
    model_version: str = "v1.0.0"
    forecast: OverloadForecast
    anomaly: AnomalyDetectionResult
    top_shap_factors: List[FeatureImportance] = Field(default_factory=list)
    recommended_action: str = "NO_ACTION_REQUIRED"
    inference_latency_ms: float = 4.5
