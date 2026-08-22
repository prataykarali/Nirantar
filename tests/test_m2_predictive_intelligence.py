"""
Unit & Integration Tests for NIRANTAR Module 2 — Predictive Intelligence (NOVA)
================================================================================
Validates Feature Extraction & Lag/Rolling Ratios, XGBoost Capacity Overload Prediction,
PyTorch Multi-Output Neural Network Inference, Isolation Forest Anomaly Scoring & Types,
SHAP Explainability Attribution & Bar Chart Rendering, 5-Model Empirical Benchmark Suite,
Critical-Region Capacity Validation (7,000–10,000 users), and all /api/v1/predictions/* endpoints.
"""

import pytest
import numpy as np

from contracts.telemetry import TelemetryEvent
from contracts.prediction import AnomalyType
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

try:
    from fastapi.testclient import TestClient
    from backend.app.main import app
    HAS_FASTAPI = True
except (ImportError, Exception):
    HAS_FASTAPI = False


@pytest.fixture
def feature_engine() -> TelemetryFeatureEngine:
    return TelemetryFeatureEngine()


@pytest.fixture
def dataset_generator() -> SyntheticTelemetryDatasetGenerator:
    return SyntheticTelemetryDatasetGenerator(seed=42)


@pytest.fixture
def explain_engine() -> TelemetryExplainabilityEngine:
    return TelemetryExplainabilityEngine()


@pytest.fixture
def test_client():
    if HAS_FASTAPI:
        return TestClient(app)
    return None


# ------------------------------------------------------------------------------
# 1. Feature Extraction & Lag / Rolling Ratios Tests
# ------------------------------------------------------------------------------

def test_feature_extraction_single_event(feature_engine: TelemetryFeatureEngine) -> None:
    """Validate 15-dim feature extraction and derived ratios on a single TelemetryEvent."""
    event = TelemetryEvent(
        service_name="BookingEngine",
        requests_per_sec=12000.0,
        concurrent_users=45000,
        cpu_percent=92.0,
        ram_percent=88.0,
        latency_p50_ms=1200.0,
        latency_p99_ms=1850.0,
        error_rate=0.08,
        queue_length=1200,
        throughput_rps=2200.0,
    )
    vector, derived = feature_engine.extract_features(event)

    assert len(vector) == len(FEATURE_NAMES)
    assert vector.shape == (15,)
    assert derived.users_per_cpu > 400.0
    assert derived.requests_per_user > 0.20
    assert derived.queue_pressure_index > 500.0
    assert derived.latency_growth_rate == 0.0  # Initial event has zero growth


def test_feature_extraction_lag_and_rolling_ratios(feature_engine: TelemetryFeatureEngine) -> None:
    """Validate historical lag, growth rate tracking, and history truncation across sequential events."""
    service_name = "PaymentGateway"

    event1 = TelemetryEvent(
        service_name=service_name,
        requests_per_sec=1000.0,
        concurrent_users=5000,
        cpu_percent=40.0,
        ram_percent=50.0,
        latency_p99_ms=100.0,
        error_rate=0.01,
        queue_length=50,
        throughput_rps=950.0,
    )
    _, derived1 = feature_engine.extract_features(event1)
    assert derived1.latency_growth_rate == 0.0
    assert derived1.cpu_growth_rate == 0.0

    # Second event with increased load
    event2 = TelemetryEvent(
        service_name=service_name,
        requests_per_sec=2000.0,
        concurrent_users=10000,
        cpu_percent=60.0,
        ram_percent=60.0,
        latency_p99_ms=200.0,
        error_rate=0.02,
        queue_length=150,
        throughput_rps=1800.0,
    )
    vector2, derived2 = feature_engine.extract_features(event2)
    assert derived2.latency_growth_rate == 1.0  # (200 - 100) / 100 = 1.0
    assert derived2.cpu_growth_rate == 0.5     # (60 - 40) / 40 = 0.5
    assert vector2[13] == pytest.approx(1.0, abs=0.01)
    assert vector2[14] == pytest.approx(0.5, abs=0.01)

    # Push 25 events to verify window stays bounded at 20 events max
    for i in range(25):
        evt = TelemetryEvent(
            service_name=service_name,
            requests_per_sec=1000.0 + i * 10,
            concurrent_users=5000 + i * 100,
            cpu_percent=40.0 + i * 0.5,
            ram_percent=50.0,
            latency_p99_ms=100.0 + i * 5,
            error_rate=0.01,
            queue_length=50,
            throughput_rps=950.0,
        )
        feature_engine.extract_features(evt)

    assert len(feature_engine.history[service_name]) == 20


def test_batch_feature_extraction(feature_engine: TelemetryFeatureEngine) -> None:
    """Validate batch feature extraction matrix shape and handling of empty lists."""
    events = [
        TelemetryEvent(service_name="S1", requests_per_sec=500.0, concurrent_users=2000, cpu_percent=30.0),
        TelemetryEvent(service_name="S2", requests_per_sec=1500.0, concurrent_users=6000, cpu_percent=70.0),
    ]
    batch_matrix = feature_engine.batch_extract(events)
    assert batch_matrix.shape == (2, 15)

    empty_matrix = feature_engine.batch_extract([])
    assert empty_matrix.shape == (0, 15)


def test_synthetic_dataset_generation(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    """Validate synthetic telemetry dataset generation shapes and target variables."""
    X, y_cls, y_reg, names = dataset_generator.generate_full_training_dataset(samples_per_scenario=20)
    assert X.shape[0] == 80
    assert X.shape[1] == 15
    assert len(y_cls) == 80
    assert y_reg.shape == (80, 4)
    assert len(names) == 15


# ------------------------------------------------------------------------------
# 2. Capacity & Overload Prediction Tests (XGBoost, Headroom, Demand)
# ------------------------------------------------------------------------------

def test_safe_capacity_prediction_calibration() -> None:
    """Validate capacity headroom calculator under CPU saturation and healthy headroom conditions."""
    calc = CapacityFeatureCalculator()
    # Problem statement benchmark test: CPU = 72%, RAM = 68%, RPS = 820, Latency = 1800ms -> Safe capacity ≈ 9,400 users
    res = calc.calculate_safe_capacity(
        cpu_percent=72.0,
        ram_percent=68.0,
        requests_per_sec=820.0,
        latency_p99_ms=1800.0,
        current_users=9000,
    )
    assert 8500 <= res["predicted_safe_capacity_users"] <= 10000
    assert res["bottleneck_resource"] in ["CPU", "LATENCY"]

    # Low load headroom test
    res_low = calc.calculate_safe_capacity(
        cpu_percent=25.0,
        ram_percent=30.0,
        requests_per_sec=200.0,
        latency_p99_ms=50.0,
        current_users=1500,
    )
    assert res_low["predicted_safe_capacity_users"] > 1500
    assert res_low["is_capacity_exceeded"] is False
    assert res_low["bottleneck_resource"] == "NONE"


def test_future_demand_forecasting() -> None:
    """Validate demand forecaster horizons for Tatkal peak window surge."""
    forecaster = FutureDemandForecaster()
    # Tatkal peak window test: Current = 5,000 -> +5m = 7,800 -> +10m = 9,400 -> +30m = 14,000
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


def test_xgboost_overload_prediction_high_and_low_stress(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    """Validate XGBoost capacity predictor overload forecast on high-stress vs normal vectors."""
    predictor = XGBoostCapacityPredictor()

    # Train on synthetic dataset
    X, _, y_reg, _ = dataset_generator.generate_full_training_dataset(samples_per_scenario=15)
    y_overload = np.array([1 if r[0] > 80.0 or r[1] > 1500.0 else 0 for r in y_reg])
    train_stats = predictor.train(X, y_overload)
    assert "status" in train_stats or "samples" in train_stats

    # High-stress vector
    overload_vec = np.array([12000.0, 45000.0, 94.0, 85.0, 500.0, 800.0, 2200.0, 0.08, 1500.0, 2100.0, 470.0, 0.26, 1200.0, 0.4, 0.2], dtype=np.float32)
    forecast_high = predictor.predict_overload_risk(overload_vec)
    assert forecast_high.overload_probability >= 0.70
    assert forecast_high.time_to_overload_minutes is not None
    assert forecast_high.predicted_peak_cpu > 90.0

    # Low-stress vector
    normal_vec = np.array([300.0, 1500.0, 20.0, 30.0, 20.0, 25.0, 40.0, 0.001, 5.0, 290.0, 75.0, 0.20, 0.5, 0.0, 0.0], dtype=np.float32)
    forecast_low = predictor.predict_overload_risk(normal_vec)
    assert forecast_low.overload_probability < 0.35
    assert forecast_low.time_to_overload_minutes is None


# ------------------------------------------------------------------------------
# 3. PyTorch Multi-Output MLP Composite Metrics Inference Tests
# ------------------------------------------------------------------------------

def test_multi_output_neural_predictor_training_and_inference(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    """Validate training and inference of 5-head multi-output PyTorch neural network."""
    predictor = MultiOutputTelemetryPredictor(input_dim=15)

    # Train on synthetic data
    X, _, y_reg, _ = dataset_generator.generate_full_training_dataset(samples_per_scenario=10)
    train_res = predictor.train(X, y_reg, epochs=5)
    assert "epochs" in train_res
    assert predictor.is_trained is True

    # High load sample vector
    sample_vec = np.array([5000.0, 25000.0, 75.0, 70.0, 300.0, 150.0, 450.0, 0.02, 300.0, 4800.0, 333.3, 0.2, 28.1, 0.05, 0.02], dtype=np.float32)
    pred = predictor.predict(sample_vec)

    expected_keys = [
        "predicted_cpu_percent",
        "predicted_ram_percent",
        "predicted_latency_p99_ms",
        "predicted_throughput_rps",
        "predicted_error_rate",
    ]
    for k in expected_keys:
        assert k in pred

    assert 0.0 <= pred["predicted_cpu_percent"] <= 100.0
    assert 0.0 <= pred["predicted_ram_percent"] <= 100.0
    assert pred["predicted_latency_p99_ms"] >= 0.0
    assert pred["predicted_throughput_rps"] >= 0.0
    assert 0.0 <= pred["predicted_error_rate"] <= 1.0


def test_multi_output_neural_predictor_deterministic_fallback() -> None:
    """Validate predictor behavior when PyTorch model is untrained or fallback mode is triggered."""
    predictor = MultiOutputTelemetryPredictor(input_dim=15)
    # Intentionally keep is_trained = False
    predictor.is_trained = False

    sample_vec = np.array([500.0, 4000.0, 40.0, 45.0, 40.0, 50.0, 90.0, 0.001, 10.0, 490.0, 100.0, 0.12, 1.8, 0.0, 0.0], dtype=np.float32)
    pred = predictor.predict(sample_vec)

    assert pred["predicted_cpu_percent"] == pytest.approx(42.0, abs=1.0)
    assert pred["predicted_ram_percent"] == pytest.approx(46.35, abs=1.0)
    assert pred["predicted_latency_p99_ms"] == pytest.approx(99.0, abs=1.0)


# ------------------------------------------------------------------------------
# 4. Isolation Forest Anomaly Scoring & Type Classification Tests
# ------------------------------------------------------------------------------

def test_isolation_forest_anomaly_types(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    """Validate Isolation Forest scoring and categorization into BOT_COORDINATION, DATABASE_LOCK, TRAFFIC_SURGE, and NONE."""
    detector = TelemetryAnomalyDetector()

    # Train on normal/mixed dataset
    X, _, _, _ = dataset_generator.generate_full_training_dataset(samples_per_scenario=10)
    detector.train(X)
    assert detector.is_trained is True

    # 1. Bot Coordination Anomaly
    bot_vec = np.array([15000.0, 2000.0, 90.0, 70.0, 600.0, 400.0, 1200.0, 0.05, 500.0, 2200.0, 22.0, 7.5, 270.0, 0.5, 0.3], dtype=np.float32)
    res_bot = detector.evaluate_anomaly(bot_vec)
    assert res_bot.is_anomaly is True
    assert res_bot.anomaly_score > 0.80
    assert res_bot.anomaly_type == AnomalyType.BOT_COORDINATION
    assert len(res_bot.suspect_features) >= 1

    # 2. Database Lock Anomaly
    db_vec = np.array([1000.0, 4000.0, 60.0, 95.0, 100.0, 200.0, 2800.0, 0.15, 800.0, 900.0, 66.0, 0.25, 2240.0, 0.8, 0.2], dtype=np.float32)
    res_db = detector.evaluate_anomaly(db_vec)
    assert res_db.is_anomaly is True
    assert res_db.anomaly_type == AnomalyType.DATABASE_LOCK

    # 3. Traffic Surge Anomaly
    surge_vec = np.array([9000.0, 35000.0, 92.0, 80.0, 400.0, 300.0, 800.0, 0.03, 300.0, 8500.0, 380.0, 0.25, 28.0, 0.1, 0.1], dtype=np.float32)
    res_surge = detector.evaluate_anomaly(surge_vec)
    assert res_surge.is_anomaly is True
    assert res_surge.anomaly_type == AnomalyType.TRAFFIC_SURGE

    # 4. Normal Telemetry
    normal_vec = np.array([400.0, 2000.0, 35.0, 40.0, 50.0, 30.0, 60.0, 0.001, 10.0, 390.0, 57.0, 0.20, 1.5, 0.0, 0.0], dtype=np.float32)
    res_normal = detector.evaluate_anomaly(normal_vec)
    assert res_normal.is_anomaly is False
    assert res_normal.anomaly_type == AnomalyType.NONE


# ------------------------------------------------------------------------------
# 5. SHAP Explainability Attribution & ASCII Bar Chart Tests
# ------------------------------------------------------------------------------

def test_shap_explainability_attribution_and_bar_chart(explain_engine: TelemetryExplainabilityEngine) -> None:
    """Validate SHAP factor attribution ordering, top-k selection, and ASCII bar chart rendering."""
    overload_vec = np.array([8000.0, 50000.0, 95.0, 80.0, 300.0, 400.0, 1600.0, 0.05, 50.0, 2000.0, 520.0, 0.16, 10.0, 0.2, 0.1], dtype=np.float32)

    factors_k3 = explain_engine.explain_overload(overload_vec, overload_prob=0.91, top_k=3)
    assert len(factors_k3) == 3

    factors_k5 = explain_engine.explain_overload(overload_vec, overload_prob=0.91, top_k=5)
    assert len(factors_k5) >= 4
    top_names = [f.feature_name for f in factors_k5]
    assert any("Concurrent Users" in n for n in top_names)
    assert any("CPU" in n for n in top_names)

    # Test visual bar chart rendering
    bar_chart = explain_engine.format_bar_chart(factors_k5)
    assert "█" in bar_chart
    assert "%" in bar_chart
    assert "Concurrent Users" in bar_chart


# ------------------------------------------------------------------------------
# 6. 5-Model Empirical Benchmark Suite Tests
# ------------------------------------------------------------------------------

def test_5_model_benchmark_suite() -> None:
    """Validate empirical comparison suite across all 5 models (XGBoost, LightGBM, PyTorch MLP, RF, Linear)."""
    suite = ModelBenchmarkSuite()
    results = suite.run_benchmark(samples_per_scenario=20)
    assert len(results) == 5

    model_names = [r["model_name"] for r in results]
    assert "XGBoost" in model_names
    assert "LightGBM" in model_names
    assert "PyTorch Multi-Output MLP" in model_names
    assert "Random Forest" in model_names
    assert "Linear / Ridge" in model_names

    for r in results:
        assert "test_mae" in r
        assert "test_rmse" in r
        assert "test_r2" in r
        assert "critical_region_mae" in r
        assert "inference_latency_ms" in r

    xgb_result = next(r for r in results if r["model_name"] == "XGBoost")
    assert xgb_result["test_r2"] > 0.90
    assert xgb_result["critical_region_mae"] < 200.0


# ------------------------------------------------------------------------------
# 7. Critical Region Capacity Validation (7,000–10,000 users) Tests
# ------------------------------------------------------------------------------

def test_critical_region_validation_stress_test(dataset_generator: SyntheticTelemetryDatasetGenerator) -> None:
    """Validate 7k–10k critical region boundary stress test steps, MAE, and stability verdict."""
    validator = CriticalRegionValidator()
    X, _, y_reg, _ = dataset_generator.generate_full_training_dataset(samples_per_scenario=20)
    y_cap = np.array([9400 - int(r[0] * 10) for r in y_reg])

    predictor = LightGBMCapacityPredictor()
    predictor.train(X, y_cap)

    eval_res = validator.evaluate_model_at_critical_boundary(lambda v: predictor.predict(v))
    assert len(eval_res["evaluation_steps"]) == 7
    assert eval_res["critical_region_mae"] < 400.0
    assert "boundary_stability_verdict" in eval_res

    # Check that evaluation steps span 7,000 to 10,000 users
    users = [step["concurrent_users"] for step in eval_res["evaluation_steps"]]
    assert users[0] == 7000
    assert users[-1] == 10000


# ------------------------------------------------------------------------------
# 8. Unified Predictive Service End-to-End Test
# ------------------------------------------------------------------------------

def test_unified_predictive_service_end_to_end() -> None:
    """Validate UnifiedPredictiveService orchestration of pipeline and sub-services."""
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


# ------------------------------------------------------------------------------
# 9. FastAPI /api/v1/predictions/* Endpoint Integration Tests
# ------------------------------------------------------------------------------

@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_forecast(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/forecast endpoint."""
    payload = {
        "service_name": "BookingEngine",
        "requests_per_sec": 12000.0,
        "concurrent_users": 45000,
        "cpu_percent": 92.0,
        "ram_percent": 88.0,
        "latency_p50_ms": 1200.0,
        "latency_p99_ms": 1850.0,
        "error_rate": 0.08,
        "queue_length": 1200,
        "throughput_rps": 2200.0,
    }
    response = test_client.post("/api/v1/predictions/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["target_service"] == "BookingEngine"
    assert "forecast" in data
    assert "anomaly" in data
    assert "top_shap_factors" in data
    assert "recommended_action" in data
    assert data["forecast"]["overload_probability"] > 0.60


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_capacity(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/capacity endpoint."""
    payload = {
        "service_name": "BookingEngine",
        "requests_per_sec": 820.0,
        "concurrent_users": 9000,
        "cpu_percent": 72.0,
        "ram_percent": 68.0,
        "latency_p99_ms": 1800.0,
    }
    response = test_client.post("/api/v1/predictions/capacity", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    assert data["service"] == "BookingEngine"
    cap = data["capacity_assessment"]
    assert 8500 <= cap["predicted_safe_capacity_users"] <= 10000
    assert "capacity_headroom_percent" in cap


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_demand(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/demand endpoint with tatkal parameter."""
    payload = {
        "service_name": "BookingEngine",
        "requests_per_sec": 600.0,
        "concurrent_users": 5000,
        "cpu_percent": 50.0,
        "ram_percent": 60.0,
        "latency_p99_ms": 200.0,
    }
    response = test_client.post("/api/v1/predictions/demand?is_tatkal=true", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    assert data["service"] == "BookingEngine"
    demand = data["demand_forecast"]
    assert "forecast_horizons" in demand
    assert demand["forecast_horizons"]["plus_5_min_users"] > 5000


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_multi_output(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/multi-output endpoint."""
    payload = {
        "service_name": "SearchService",
        "requests_per_sec": 500.0,
        "concurrent_users": 4000,
        "cpu_percent": 40.0,
        "ram_percent": 45.0,
        "latency_p50_ms": 30.0,
        "latency_p99_ms": 90.0,
        "error_rate": 0.001,
        "queue_length": 10,
        "throughput_rps": 490.0,
    }
    response = test_client.post("/api/v1/predictions/multi-output", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    assert data["service"] == "SearchService"
    neural = data["neural_predictions"]
    assert "predicted_cpu_percent" in neural
    assert "predicted_ram_percent" in neural
    assert "predicted_latency_p99_ms" in neural
    assert "predicted_throughput_rps" in neural
    assert "predicted_error_rate" in neural


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_anomaly(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/anomaly endpoint."""
    payload = {
        "service_name": "AuthService",
        "requests_per_sec": 16000.0,
        "concurrent_users": 2000,
        "cpu_percent": 90.0,
        "ram_percent": 70.0,
        "latency_p99_ms": 1200.0,
        "error_rate": 0.05,
    }
    response = test_client.post("/api/v1/predictions/anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_anomaly"] is True
    assert data["anomaly_score"] > 0.80
    assert data["anomaly_type"] == "BOT_COORDINATION"


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_explain(test_client: TestClient) -> None:
    """Test POST /api/v1/predictions/explain endpoint."""
    payload = {
        "service_name": "BookingEngine",
        "requests_per_sec": 8000.0,
        "concurrent_users": 50000,
        "cpu_percent": 95.0,
        "ram_percent": 80.0,
        "latency_p99_ms": 1600.0,
    }
    response = test_client.post("/api/v1/predictions/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    exp = data["explainability"]
    assert "overload_probability" in exp
    assert "top_factors" in exp
    assert "bar_chart_visualization" in exp
    assert "█" in exp["bar_chart_visualization"]


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_benchmark(test_client: TestClient) -> None:
    """Test GET /api/v1/predictions/benchmark endpoint."""
    response = test_client.get("/api/v1/predictions/benchmark")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    summary = data["benchmark_summary"]
    assert len(summary) == 5


@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI or TestClient not available")
def test_api_predictions_critical_region(test_client: TestClient) -> None:
    """Test GET /api/v1/predictions/critical-region endpoint."""
    response = test_client.get("/api/v1/predictions/critical-region")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == 200
    crit = data["critical_region_validation"]
    assert "evaluation_steps" in crit
    assert len(crit["evaluation_steps"]) == 7
