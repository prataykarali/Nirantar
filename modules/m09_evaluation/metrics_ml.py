"""8.1 ML metrics — MAE, RMSE, R² measured on a held-out synthetic set."""

from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split

from contracts.experiment import MLMetrics
from ml.data.generator import SyntheticTelemetryDatasetGenerator
from ml.evaluation.metrics import PerformanceMetricsEvaluator

DATASET_VERSION = "synthetic-telemetry-v1"
MODEL_VERSION = "ridge-latency-p99-v1"


def measure_prediction_metrics(seed: int = 42, samples_per_scenario: int = 80) -> MLMetrics:
    """Regress p99 latency. Selection must not rest on R² alone."""
    gen = SyntheticTelemetryDatasetGenerator(seed=seed)
    X, _y_over, y_multi, _names = gen.generate_full_training_dataset(
        samples_per_scenario=samples_per_scenario
    )
    y = y_multi[:, 1]  # latency_p99_ms
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=seed
    )
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    scores = PerformanceMetricsEvaluator.evaluate_predictions(y_test, pred)
    return MLMetrics(
        mae=scores["mae"],
        rmse=scores["rmse"],
        r2=scores["r2_score"],
        samples=int(len(y_test)),
        task="latency_p99_regression",
    )


def latency_arrays(seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    gen = SyntheticTelemetryDatasetGenerator(seed=seed)
    X, _y_over, y_multi, _names = gen.generate_full_training_dataset(80)
    y = y_multi[:, 1]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)
    return y_test, model.predict(X_test)
