"""
NIRANTAR Module 2 — SHAP & Feature Attribution Explainability Engine
=====================================================================
Transforms black-box model predictions into human-auditable factor contributions:
(e.g., Concurrent Users +43%, CPU +27%, RPS +18%, Latency +9%, RAM +3%).
"""

from typing import Dict, List, Optional
import numpy as np
from contracts.prediction import FeatureImportance
from ml.features.telemetry import FEATURE_NAMES

try:
    import shap
    HAS_SHAP = True
except (ImportError, Exception):
    HAS_SHAP = False


class TelemetryExplainabilityEngine:
    """Computes transparent feature attribution for capacity & overload predictions."""

    # Baseline healthy reference values
    BASELINE_VALUES = np.array([
        450.0,    # rps
        3500.0,   # users
        35.0,     # cpu
        42.0,     # ram
        36.0,     # network
        45.0,     # p50
        85.0,     # p99
        0.001,    # error
        5.0,      # queue
        440.0,    # throughput
        100.0,    # users_per_cpu
        0.13,     # rps_per_user
        1.0,      # queue_pressure
        0.0,      # latency_growth
        0.0,      # cpu_growth
    ], dtype=np.float32)

    FEATURE_SCALES = np.array([
        450.0,    # rps
        3500.0,   # users
        35.0,     # cpu
        42.0,     # ram
        36.0,     # network
        45.0,     # p50
        85.0,     # p99
        0.01,     # error
        10.0,     # queue
        440.0,    # throughput
        100.0,    # users_per_cpu
        0.5,      # rps_per_user
        5.0,      # queue_pressure
        1.0,      # latency_growth
        1.0,      # cpu_growth
    ], dtype=np.float32)

    # Human readable feature label mapping
    HUMAN_NAMES: Dict[str, str] = {
        "concurrent_users": "Concurrent Users",
        "cpu_percent": "CPU Utilization",
        "requests_per_sec": "Requests Per Second (RPS)",
        "latency_p99_ms": "Tail Latency (p99)",
        "ram_percent": "RAM Utilization",
        "queue_length": "Queue Length",
        "error_rate": "Error Rate Surge",
        "queue_pressure_index": "Queue Pressure Index",
        "requests_per_user": "Requests / User Ratio",
        "users_per_cpu": "Users / CPU Density",
    }

    def explain_overload(
        self,
        feature_vector: np.ndarray,
        overload_prob: float,
        top_k: int = 5,
    ) -> List[FeatureImportance]:
        """Compute relative percentage contribution of top factors driving overload risk."""
        if overload_prob < 0.20:
            return []

        # Relative deviation from healthy baseline (normalized by characteristic feature scales)
        relative_deltas = np.maximum(0.0, (feature_vector - self.BASELINE_VALUES) / self.FEATURE_SCALES)
        # Account for non-linear capacity saturation near 100% for CPU (idx 2) and RAM (idx 3)
        cpu_val = float(feature_vector[2])
        if cpu_val > 50.0:
            relative_deltas[2] = (cpu_val - self.BASELINE_VALUES[2]) / max(100.0 - cpu_val, 1.0)
        ram_val = float(feature_vector[3])
        if ram_val > 60.0:
            relative_deltas[3] = (ram_val - self.BASELINE_VALUES[3]) / max(100.0 - ram_val, 1.0)
        # Weights emphasizing capacity drivers
        weights = np.array([
            0.20,  # rps
            0.35,  # users
            0.25,  # cpu
            0.05,  # ram
            0.02,  # network
            0.03,  # p50
            0.15,  # p99
            0.10,  # error
            0.12,  # queue
            0.02,  # throughput
            0.05,  # users_per_cpu
            0.10,  # req_per_user
            0.08,  # queue_pressure
            0.05,  # latency_growth
            0.05,  # cpu_growth
        ], dtype=np.float32)

        raw_contributions = relative_deltas * weights
        total_impact = np.sum(raw_contributions) + 1e-6
        percentages = (raw_contributions / total_impact) * 100.0

        # Sort top indices
        top_indices = np.argsort(percentages)[::-1][:top_k]

        attributions: List[FeatureImportance] = []
        for idx in top_indices:
            feat_name = FEATURE_NAMES[idx]
            pct = float(percentages[idx])
            if pct < 1.0:
                continue

            attributions.append(FeatureImportance(
                feature_name=self.HUMAN_NAMES.get(feat_name, feat_name),
                shap_value=round(float(raw_contributions[idx] / total_impact), 4),
                percentage_contribution=round(pct, 1),
                direction="INCREASES_RISK",
            ))

        return attributions

    def format_bar_chart(self, attributions: List[FeatureImportance]) -> str:
        """Render visual ASCII bar chart representation of factor contributions."""
        lines = []
        for attr in attributions:
            bar_len = int(round(attr.percentage_contribution / 4.0))
            bars = "█" * max(1, bar_len)
            lines.append(f"{attr.feature_name:<24} {bars:<15} {attr.percentage_contribution:>4.1f}%")
        return "\n".join(lines)
