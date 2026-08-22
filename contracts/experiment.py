"""
NIRANTAR Contracts — Experiment, Benchmark & Evaluation Schemas
===============================================================
Owned by Agent 2 (NOVA) & Agent 1 (ORBIT). Enforces empirical claims (Critical Rule: Zero invented metrics).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class BenchmarkMetrics(BaseModel):
    """Empirical load and latency measurements."""
    total_requests: int = 0
    p50_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    max_rps_achieved: float = 0.0
    error_percentage: float = 0.0
    throughput_stability_index: float = Field(default=1.0, ge=0.0, le=1.0)
    recovery_time_seconds: float = 0.0


class ModelEvaluationReport(BaseModel):
    """Standardized report for ML models."""
    model_name: str = "XGBoost_Capacity"
    task: str = "Regression"
    train_samples: int = 50000
    test_samples: int = 10000
    mae: float = 0.0
    rmse: float = 0.0
    r2_score: float = 0.0
    f1_score: Optional[float] = None
    inference_latency_p99_ms: float = 2.5
    feature_names: List[str] = Field(default_factory=list)
    reproducible_seed: int = 42


class MLMetrics(BaseModel):
    """Prediction metrics. Do not select a model on R² alone."""
    mae: float = 0.0
    rmse: float = 0.0
    r2: float = 0.0
    samples: int = 0
    task: str = "latency_p99_regression"


class InfraMetrics(BaseModel):
    p50_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    throughput_rps: float = 0.0
    error_rate: float = 0.0
    cpu_percent: float = 0.0
    ram_percent: float = 0.0
    db_utilization: float = 0.0


class SecurityEvalMetrics(BaseModel):
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    false_positives: int = 0
    false_negatives: int = 0
    true_positives: int = 0
    true_negatives: int = 0
    detection_latency_s: float = 0.0


class ResilienceMetrics(BaseModel):
    """Flagship: Protected Citizen Transaction Rate."""
    successful_legitimate_critical: int = 0
    total_legitimate_critical: int = 0
    protected_citizen_transaction_rate: float = 0.0
    legitimate_users_blocked: int = 0
    suspicious_traffic_contained: int = 0


class ReproducibilityRecord(BaseModel):
    dataset_version: str = "synthetic-telemetry-v1"
    model_version: str = "linear-capacity-v1"
    configuration: Dict[str, Any] = Field(default_factory=dict)
    experiment_id: str = ""
    random_seed: int = 42
    scenario: str = "NORMAL"
    timestamp: str = ""
    metrics: Dict[str, Any] = Field(default_factory=dict)


class ComparisonRow(BaseModel):
    metric: str
    baseline: Optional[float] = None
    nirantar: Optional[float] = None


class ExperimentResult(BaseModel):
    """Comparative experiment result proving NIRANTAR resilience."""
    experiment_id: str = Field(default_factory=lambda: f"EXP-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    scenario_name: str = "Tatkal Surge 10K VUs"
    baseline_unprotected: BenchmarkMetrics
    nirantar_orchestrated: BenchmarkMetrics
    latency_reduction_pct: float = 0.0
    error_reduction_pct: float = 0.0
    degradation_prevented: bool = True
    cairo_proof_hash: Optional[str] = None
    ml: Optional[MLMetrics] = None
    infra_baseline: Optional[InfraMetrics] = None
    infra_nirantar: Optional[InfraMetrics] = None
    security_baseline: Optional[SecurityEvalMetrics] = None
    security_nirantar: Optional[SecurityEvalMetrics] = None
    resilience_baseline: Optional[ResilienceMetrics] = None
    resilience_nirantar: Optional[ResilienceMetrics] = None
    comparison: List[ComparisonRow] = Field(default_factory=list)
    explainability: List[Dict[str, Any]] = Field(default_factory=list)
    reproducibility: Optional[ReproducibilityRecord] = None
