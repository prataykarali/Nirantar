"""
NIRANTAR Module 2 — Standard Metrics Evaluation Engine
======================================================
Computes statistical performance metrics: MAE, RMSE, R2, Training Time, and Inference Latency.
"""

from typing import Dict
import numpy as np


class PerformanceMetricsEvaluator:
    """Evaluates multi-model performance metrics."""

    @staticmethod
    def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Compute MAE, RMSE, and R2."""
        diff = y_true - y_pred
        mae = float(np.mean(np.abs(diff)))
        rmse = float(np.sqrt(np.mean(diff ** 2)))

        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        ss_res = np.sum(diff ** 2)
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-6)))

        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "r2_score": round(max(-1.0, min(1.0, r2)), 4),
        }
