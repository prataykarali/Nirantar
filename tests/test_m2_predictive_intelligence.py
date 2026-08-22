"""
Unit & Integration Tests for NIRANTAR Module 2 — Predictive Intelligence (NOVA)
================================================================================
Validates Capacity Prediction, Demand Forecasting, Multi-Output Neural Network,
Isolation Forest Anomaly Detection, SHAP Explainability, and Critical-Region Boundary Tests.
"""

import pytest
import numpy as np
from contracts.telemetry import TelemetryEvent
from ml.features.telemetry import TelemetryFeatureEngine, FEATURE_NAMES
from ml.features.capacity import CapacityFeatureCalculator
from ml.data.generator import SyntheticTelemetryDatasetGenerator
from ml.models.baseline.linear import LinearCapacityPredictor
from ml.models.baseline.random_forest import RandomForestCapacityPredictor
from ml.models.baseline.xgboost_model import XGBoostCapacityPredictor
from ml.models.baseline.lightgbm_model import LightGBMCapacityPredictor
from ml.models.neural.multi_output_mlp import MultiOutputTelemetryPredictor
from ml.models.anomaly.isolation_forest import TelemetryAnomalyDetector
from ml.models.forecasting.demand_forecaster import FutureDemandForecaster
from ml.evaluation.explainability import TelemetryExplainabilityEngine
from ml.evaluation.critical_region import CriticalRegionValidator
from ml.training.compare import ModelBenchmarkSuite
from backend.app.services.prediction.predictor import UnifiedPredictiveService


@pytest.fixture
def feature_engine() -> TelemetryFeatureEngine:
    return TelemetryFeatureEngine()


@pytest.fixture
def dataset_generator() -> SyntheticTelemetryDatasetGenerator:
    return SyntheticTelemetryDatasetGenerator(seed=42)


@pytest.fixture
def explain_engine() -> TelemetryExplainabilityEngine:
    return TelemetryExplainabilityEngine()


def test_feature_extraction(feature_engine: TelemetryFeatureEngine) -> None:
    event = TelemetryEvent(
        service_name="BookingEngine",
        requests_per_sec=12000.0,
        concurrent_users=45000,
        cpu_percent=92.0,
        ram_percent=88.0,
        latency_p99_ms=1850.0,
        error_rate=0.08,
        queue_length=1200,
        throughput_rps=2200.0,
    )
    vector, derived = feature_engine.extract_features(event)

    assert len(vector) == len(FEATURE_NAMES)
    assert derived.users_per_cpu > 400.0
    assert derived.requests_per_user > 0.20
    assert derived.queue_pressure_index > 500.0


def test_synthetic_dataset_generation(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    X, y_cls, y_reg, names = dataset_generator.generate_full_training_dataset(samples_per_scenario=20)
    assert X.shape[0] == 80
    assert X.shape[1] == 15
    assert len(y_cls) == 80
    assert y_reg.shape == (80, 4)
    assert len(names) == 15


def test_safe_capacity_prediction_calibration() -> None:
    calc = CapacityFeatureCalculator()
    # Problem statement test: CPU = 72%, RAM = 68%, RPS = 820, Latency = 1800ms -> Safe capacity ≈ 9,400 users
    res = calc.calculate_safe_capacity(
        cpu_percent=72.0,
        ram_percent=68.0,
        requests_per_sec=820.0,
        latency_p99_ms=1800.0,
        current_users=9000,
    )
    assert 8500 <= res["predicted_safe_capacity_users"] <= 10000
    assert res["bottleneck_resource"] in ["CPU", "LATENCY"]


def test_future_demand_forecasting() -> None:
    forecaster = FutureDemandForecaster()
    # Problem statement test: Current = 5,000 -> +5m = 7,800 -> +10m = 9,400 -> +30m = 14,000
    res = forecaster.forecast_demand(
        current_users=5000,
        user_growth_rate=0.20,
        current_rps=600.0,
        is_tatkal_window=True,
    )
    h = res["forecast_horizons"]
    assert 7500 <= h["plus_5_min_users"] <= 8200
    assert 9000 <= h["plus_10_min_users"] <= 9800
    assert 13500 <= h["plus_30_min_users"] <= 14500
    assert res["will_overload_in_30m"] is True
    assert res["time_to_overload_minutes"] is not None


def test_critical_region_validation_stress_test(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    validator = CriticalRegionValidator()
    X, _, y_reg, _ = dataset_generator.generate_full_training_dataset(samples_per_scenario=20)
    y_cap = np.array([9400 - int(r[0] * 10) for r in y_reg])

    predictor = LightGBMCapacityPredictor()
    predictor.train(X, y_cap)

    eval_res = validator.evaluate_model_at_critical_boundary(lambda v: predictor.predict(v))
    assert len(eval_res["evaluation_steps"]) == 7
    assert eval_res["critical_region_mae"] < 400.0
    assert "boundary_stability_verdict" in eval_res


def test_xgboost_overload_prediction() -> None:
    predictor = XGBoostCapacityPredictor()
    overload_vec = np.array([12000.0, 45000.0, 94.0, 85.0, 500.0, 800.0, 2200.0, 0.08, 1500.0, 2100.0, 470.0, 0.26, 1200.0, 0.4, 0.2], dtype=np.float32)

    forecast = predictor.predict_overload_risk(overload_vec)
    assert forecast.overload_probability >= 0.70
    assert forecast.time_to_overload_minutes is not None
    assert forecast.predicted_peak_cpu > 90.0


def test_multi_output_neural_predictor() -> None:
    predictor = MultiOutputTelemetryPredictor(input_dim=15)
    sample_vec = np.array([500.0, 4000.0, 40.0, 45.0, 40.0, 50.0, 90.0, 0.001, 10.0, 490.0, 100.0, 0.12, 1.8, 0.0, 0.0], dtype=np.float32)

    pred = predictor.predict(sample_vec)
    assert "predicted_cpu_percent" in pred
    assert "predicted_ram_percent" in pred
    assert "predicted_latency_p99_ms" in pred
    assert "predicted_throughput_rps" in pred
    assert "predicted_error_rate" in pred
    assert pred["predicted_cpu_percent"] >= 0.0


def test_isolation_forest_anomaly_detection() -> None:
    detector = TelemetryAnomalyDetector()
    bot_vec = np.array([15000.0, 2000.0, 90.0, 70.0, 600.0, 400.0, 1200.0, 0.05, 500.0, 2200.0, 22.0, 7.5, 270.0, 0.5, 0.3], dtype=np.float32)

    res = detector.evaluate_anomaly(bot_vec)
    assert res.is_anomaly is True
    assert res.anomaly_score > 0.80
    assert res.anomaly_type.value == "BOT_COORDINATION"
    assert len(res.suspect_features) >= 1


def test_shap_explainability_attribution_and_bar_chart(explain_engine: TelemetryExplainabilityEngine) -> None:
    overload_vec = np.array([8000.0, 50000.0, 95.0, 80.0, 300.0, 400.0, 1600.0, 0.05, 50.0, 2000.0, 520.0, 0.16, 10.0, 0.2, 0.1], dtype=np.float32)
    factors = explain_engine.explain_overload(overload_vec, overload_prob=0.91, top_k=5)

    assert len(factors) >= 3
    top_names = [f.feature_name for f in factors]
    assert any("Concurrent Users" in n for n in top_names)
    assert any("CPU" in n for n in top_names)

    # Test visual bar chart rendering
    bar_chart = explain_engine.format_bar_chart(factors)
    assert "█" in bar_chart
    assert "%" in bar_chart


def test_5_model_benchmark_suite() -> None:
    suite = ModelBenchmarkSuite()
    results = suite.run_benchmark(samples_per_scenario=20)
    assert len(results) == 5
    model_names = [r["model_name"] for r in results]
    assert "XGBoost" in model_names
    assert "LightGBM" in model_names
    assert "PyTorch Multi-Output MLP" in model_names
    assert "Random Forest" in model_names
    assert "Linear / Ridge" in model_names

    xgb_result = next(r for r in results if r["model_name"] == "XGBoost")
    assert xgb_result["test_r2"] > 0.90
    assert xgb_result["critical_region_mae"] < 200.0


def test_unified_predictive_service_end_to_end() -> None:
    service = UnifiedPredictiveService()
    event = TelemetryEvent(
        service_name="BookingEngine",
        requests_per_sec=14000.0,
        concurrent_users=48000,
        cpu_percent=94.0,
        ram_percent=86.0,
        latency_p99_ms=2100.0,
        error_rate=0.09,
        queue_length=1600,
        throughput_rps=2300.0,
    )
    result = service.predict_telemetry_event(event)

    assert result.target_service == "BookingEngine"
    assert result.forecast.overload_probability > 0.60
    assert len(result.top_shap_factors) >= 1
    assert result.inference_latency_ms > 0.0
    assert result.recommended_action != "NO_ACTION_REQUIRED"

    # Test individual sub-service calls
    cap_res = service.predict_safe_capacity(event)
    assert "predicted_safe_capacity_users" in cap_res

    demand_res = service.forecast_demand(event, is_tatkal=True)
    assert "forecast_horizons" in demand_res

    explain_res = service.explain_factors_with_chart(event)
    assert "bar_chart_visualization" in explain_res
