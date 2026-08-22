"""
NIRANTAR Module 2 — Isolation Forest Anomaly Detector
=====================================================
Unsupervised anomaly detection identifying abnormal traffic patterns,
database locks, and coordinated bot surges before failures propagate.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from contracts.prediction import AnomalyDetectionResult, AnomalyType

try:
    from sklearn.ensemble import IsolationForest
    HAS_SKLEARN = True
except (ImportError, Exception):
    HAS_SKLEARN = False


class TelemetryAnomalyDetector:
    """Isolation Forest anomaly evaluator for real-time telemetry events."""

    def __init__(self, contamination: float = 0.08) -> None:
        self.contamination = contamination
        self.model: Optional[Any] = None
        self.is_trained = False
        if HAS_SKLEARN:
            self.model = IsolationForest(
                n_estimators=100,
                contamination=contamination,
                random_state=42,
            )

    def train(self, X: np.ndarray) -> Dict[str, float]:
        """Fit Isolation Forest on normal and mixed operational telemetry."""
        if HAS_SKLEARN and self.model is not None:
            self.model.fit(X)
            self.is_trained = True
            return {"samples": float(len(X)), "contamination": self.contamination}

        self.is_trained = True
        return {"samples": float(len(X)), "status": "fallback"}

    def evaluate_anomaly(self, feature_vector: np.ndarray) -> AnomalyDetectionResult:
        """Evaluate whether a telemetry feature vector represents an anomaly."""
        vec = feature_vector.reshape(1, -1)
        suspects: List[str] = []

        rps = float(vec[0, 0])
        users = float(vec[0, 1])
        cpu = float(vec[0, 2])
        ram = float(vec[0, 3])
        p99 = float(vec[0, 6])
        error = float(vec[0, 7])
        req_per_user = float(vec[0, 11])

        # Anomaly categorization heuristics
        anomaly_type = AnomalyType.NONE
        is_anomaly = False
        anomaly_score = 0.05

        if req_per_user > 4.0 and rps > 5000:
            anomaly_type = AnomalyType.BOT_COORDINATION
            is_anomaly = True
            anomaly_score = 0.92
            suspects.append(f"Abnormal requests/user ratio ({req_per_user:.2f})")
            suspects.append(f"Excessive RPS ({rps:.0f}) with low unique user count ({users:.0f})")

        elif p99 > 2500.0 or (ram > 90.0 and error > 0.10):
            anomaly_type = AnomalyType.DATABASE_LOCK
            is_anomaly = True
            anomaly_score = 0.88
            suspects.append(f"p99 latency explosion ({p99:.1f}ms)")
            suspects.append(f"High RAM usage ({ram:.1f}%) with elevated error rate ({error:.2%})")

        elif users > 30000 or cpu > 90.0:
            anomaly_type = AnomalyType.TRAFFIC_SURGE
            is_anomaly = True
            anomaly_score = 0.82
            suspects.append(f"Extreme concurrent user volume ({users:.0f})")
            suspects.append(f"CPU saturation ({cpu:.1f}%)")

        elif HAS_SKLEARN and self.model is not None and self.is_trained:
            # Model score: lower means more anomalous
            raw_score = float(self.model.decision_function(vec)[0])
            # Transform to [0, 1] anomaly score
            anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
            if anomaly_score > 0.60:
                is_anomaly = True
                anomaly_type = AnomalyType.LATENCY_SPIKE if p99 > 300.0 else AnomalyType.TRAFFIC_SURGE
                suspects.append("Statistical outlier detected by Isolation Forest")

        return AnomalyDetectionResult(
            is_anomaly=is_anomaly,
            anomaly_score=round(anomaly_score, 3),
            anomaly_type=anomaly_type,
            suspect_features=suspects,
            confidence=0.94 if is_anomaly else 0.98,
        )
