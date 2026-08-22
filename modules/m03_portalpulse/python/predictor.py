"""
NIRANTAR Module 2 — Real-Time Unified Prediction & Intelligence Service
========================================================================
Combines capacity prediction, 5-head multi-output forecasting, anomaly scoring,
demand time-series forecasting, and SHAP factor attribution into a unified pipeline.
"""

import time
from typing import Any, Dict, List, Optional
from contracts.telemetry import TelemetryEvent
from contracts.prediction import PredictionResult, ModelType
from ml.features.telemetry import TelemetryFeatureEngine
from ml.features.capacity import CapacityFeatureCalculator
from ml.models.baseline.xgboost_model import XGBoostCapacityPredictor
from ml.models.neural.multi_output_mlp import MultiOutputTelemetryPredictor
from ml.models.anomaly.isolation_forest import TelemetryAnomalyDetector
from ml.models.forecasting.demand_forecaster import FutureDemandForecaster
from ml.evaluation.explainability import TelemetryExplainabilityEngine
from ml.evaluation.critical_region import CriticalRegionValidator


class UnifiedPredictiveService:
    """Production inference service combining GBDT, Neural Multi-Output, Demand, and Anomaly models."""

    def __init__(self) -> None:
        self.feature_engine = TelemetryFeatureEngine()
        self.capacity_calc = CapacityFeatureCalculator()
        self.xgboost_model = XGBoostCapacityPredictor()
        self.neural_model = MultiOutputTelemetryPredictor()
        self.anomaly_detector = TelemetryAnomalyDetector()
        self.demand_forecaster = FutureDemandForecaster()
        self.explain_engine = TelemetryExplainabilityEngine()
        self.critical_validator = CriticalRegionValidator()

    def predict_telemetry_event(self, event: TelemetryEvent) -> PredictionResult:
        """Run full predictive pipeline on a single incoming TelemetryEvent."""
        start_time = time.perf_counter()

        # 1. Extract feature vector and derived metrics
        features, _ = self.feature_engine.extract_features(event)

        # 2. XGBoost Overload Risk & Peak Forecast
        forecast = self.xgboost_model.predict_overload_risk(features)

        # 3. Isolation Forest Anomaly Detection
        anomaly = self.anomaly_detector.evaluate_anomaly(features)

        # 4. Multi-Output Neural Network (Regression on CPU, RAM, Latency, Throughput, Error)
        _ = self.neural_model.predict(features)

        # 5. SHAP Factor Attribution (Transparent Explainability)
        top_factors = self.explain_engine.explain_overload(features, forecast.overload_probability)

        # 6. Action Recommendation for Orchestrator (DHARA)
        recommended_action = "NO_ACTION_REQUIRED"
        if forecast.overload_probability > 0.80 or anomaly.is_anomaly:
            if anomaly.anomaly_type.value == "BOT_COORDINATION":
                recommended_action = "ACTIVATE_TOKEN_BUCKET_RATE_LIMITER"
            elif anomaly.anomaly_type.value == "DATABASE_LOCK":
                recommended_action = "ENABLE_DATABASE_POOL_PROTECTION"
            else:
                recommended_action = "ACTIVATE_TATKAL_PRIORITY_QUEUE"
        elif forecast.overload_probability > 0.50:
            recommended_action = "PRE_WARM_CACHE_AND_PREPARE_QUEUE"

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return PredictionResult(
            target_service=event.service_name,
            model_type=ModelType.XGBOOST,
            forecast=forecast,
            anomaly=anomaly,
            top_shap_factors=top_factors,
            recommended_action=recommended_action,
            inference_latency_ms=round(max(0.5, latency_ms), 2),
        )

    def predict_safe_capacity(self, event: TelemetryEvent) -> Dict[str, Any]:
        """Calculate safe operating user capacity under current server conditions."""
        return self.capacity_calc.calculate_safe_capacity(
            cpu_percent=event.cpu_percent,
            ram_percent=event.ram_percent,
            requests_per_sec=event.requests_per_sec,
            latency_p99_ms=event.latency_p99_ms,
            current_users=event.concurrent_users,
            error_rate=event.error_rate,
        )

    def forecast_demand(self, event: TelemetryEvent, is_tatkal: bool = False) -> Dict[str, Any]:
        """Generate time-series arrival forecast at +5m, +10m, +15m, and +30m."""
        features, derived = self.feature_engine.extract_features(event)
        return self.demand_forecaster.forecast_demand(
            current_users=event.concurrent_users,
            user_growth_rate=derived.latency_growth_rate,
            current_rps=event.requests_per_sec,
            is_tatkal_window=is_tatkal,
        )

    def predict_multi_output(self, event: TelemetryEvent) -> Dict[str, float]:
        """Predict 5-head neural output metrics."""
        features, _ = self.feature_engine.extract_features(event)
        return self.neural_model.predict(features)

    def explain_factors_with_chart(self, event: TelemetryEvent) -> Dict[str, Any]:
        """Compute SHAP factor attribution with visual ASCII bars."""
        features, _ = self.feature_engine.extract_features(event)
        forecast = self.xgboost_model.predict_overload_risk(features)
        factors = self.explain_engine.explain_overload(features, forecast.overload_probability)
        bar_chart = self.explain_engine.format_bar_chart(factors)
        return {
            "overload_probability": forecast.overload_probability,
            "top_factors": [f.dict() for f in factors],
            "bar_chart_visualization": bar_chart,
        }

    def validate_critical_region(self) -> Dict[str, Any]:
        """Run 7k-10k critical region validation curve."""
        return self.critical_validator.evaluate_model_at_critical_boundary(
            lambda vec: int(self.capacity_calc.calculate_safe_capacity(
                cpu_percent=float(vec[2]),
                ram_percent=float(vec[3]),
                requests_per_sec=float(vec[0]),
                latency_p99_ms=float(vec[6]),
                current_users=int(vec[1]),
            )["predicted_safe_capacity_users"])
        )
