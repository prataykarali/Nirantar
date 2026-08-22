"""
NIRANTAR Module 2 — Predictive Intelligence API Endpoints
=========================================================
Exposes Capacity Prediction, Demand Forecasting, Multi-Output Neural Inference,
Isolation Forest Anomaly Scoring, SHAP Explainability, and Model Benchmarks.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Body, Query
from contracts.telemetry import TelemetryEvent
from contracts.prediction import PredictionResult, AnomalyDetectionResult
from backend.app.services.prediction.predictor import UnifiedPredictiveService
from ml.training.compare import ModelBenchmarkSuite

router = APIRouter(prefix="/api/v1/predictions", tags=["Predictive Intelligence"])

predictor = UnifiedPredictiveService()
benchmark_suite = ModelBenchmarkSuite()


@router.post("/forecast", response_model=PredictionResult)
def predict_overload_and_forecast(event: TelemetryEvent = Body(...)) -> PredictionResult:
    """Run real-time ML prediction, overload forecast, and SHAP factor attribution."""
    return predictor.predict_telemetry_event(event)


@router.post("/capacity")
def predict_safe_capacity(event: TelemetryEvent = Body(...)) -> Dict[str, Any]:
    """Predict safe operating user capacity (e.g. CPU=72%, Latency=1.8s -> Safe Capacity ~9,400)."""
    return {
        "status": 200,
        "service": event.service_name,
        "capacity_assessment": predictor.predict_safe_capacity(event),
    }


@router.post("/demand")
def forecast_future_demand(
    event: TelemetryEvent = Body(...),
    is_tatkal: bool = Query(default=False),
) -> Dict[str, Any]:
    """Generate time-series arrival forecast at +5m, +10m, +15m, and +30m."""
    return {
        "status": 200,
        "service": event.service_name,
        "demand_forecast": predictor.forecast_demand(event, is_tatkal=is_tatkal),
    }


@router.post("/multi-output")
def predict_multi_output_metrics(event: TelemetryEvent = Body(...)) -> Dict[str, Any]:
    """PyTorch Multi-Output Neural Network predicting [CPU, RAM, Latency, Throughput, Error]."""
    return {
        "status": 200,
        "service": event.service_name,
        "neural_predictions": predictor.predict_multi_output(event),
    }


@router.post("/anomaly", response_model=AnomalyDetectionResult)
def evaluate_telemetry_anomaly(event: TelemetryEvent = Body(...)) -> AnomalyDetectionResult:
    """Isolation Forest anomaly detection on real-time telemetry."""
    features, _ = predictor.feature_engine.extract_features(event)
    return predictor.anomaly_detector.evaluate_anomaly(features)


@router.post("/explain")
def explain_overload_factors(event: TelemetryEvent = Body(...)) -> Dict[str, Any]:
    """Explain prediction with SHAP percentage factor attribution and ASCII bar charts."""
    return {
        "status": 200,
        "service": event.service_name,
        "explainability": predictor.explain_factors_with_chart(event),
    }


@router.get("/benchmark")
def get_model_benchmarks() -> Dict[str, Any]:
    """Retrieve empirical 5-model comparison metrics (XGBoost, LightGBM, PyTorch MLP, RF, Linear)."""
    return {
        "status": 200,
        "benchmark_summary": benchmark_suite.run_benchmark(),
    }


@router.get("/critical-region")
def get_critical_region_validation() -> Dict[str, Any]:
    """Run stress-test evaluation across the critical capacity boundary (7,000–10,000 users)."""
    return {
        "status": 200,
        "critical_region_validation": predictor.validate_critical_region(),
    }
