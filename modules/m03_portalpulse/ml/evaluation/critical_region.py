"""
NIRANTAR Module 2 — Critical-Region Capacity Validation Suite
=============================================================
Stress-tests capacity predictions around the non-linear saturation boundary:
[7,000, 7,500, 8,000, 8,500, 9,000, 9,500, 10,000 users] where queuing delays become non-linear.
"""

from typing import Any, Callable, Dict, List, Optional, Tuple
import numpy as np


class CriticalRegionValidator:
    """Evaluates ML model performance specifically across the critical 7k–10k capacity boundary."""

    CRITICAL_POINTS: List[int] = [7000, 7500, 8000, 8500, 9000, 9500, 10000]

    def evaluate_model_at_critical_boundary(
        self,
        predictor_func: Callable[[np.ndarray], int],
        feature_generator_func: Optional[Callable[[int], np.ndarray]] = None,
    ) -> Dict[str, Any]:
        """
        Runs step-by-step stress tests across the capacity boundary:
        Evaluates prediction stability, critical-region MAE, and safety margins.
        """
        eval_points = []
        errors = []

        for target_users in self.CRITICAL_POINTS:
            # Generate simulated telemetry for target users at boundary
            # CPU scales non-linearly near 9,000 users
            cpu = float(np.clip(50.0 + (target_users - 7000) / 3000.0 * 45.0, 50.0, 96.0))
            p99 = float(np.clip(80.0 + ((target_users - 7000) / 3000.0) ** 2 * 1200.0, 80.0, 1800.0))
            rps = float(target_users * 0.12)
            queue = int(max(0, (target_users - 8000) * 0.2)) if target_users > 8000 else 0

            # Ground truth safe capacity
            if target_users < 8000:
                ground_truth_safe = 9400
            elif target_users <= 9000:
                ground_truth_safe = 9200
            else:
                ground_truth_safe = 8600

            # 15-dimensional vector
            vec = np.array([
                rps, float(target_users), cpu, 65.0, rps * 0.08,
                p99 * 0.4, p99, 0.002, float(queue), rps * 0.95,
                float(target_users) / cpu, 0.12, (queue * p99) / max(1.0, rps),
                0.05, 0.05,
            ], dtype=np.float32)

            predicted_capacity = predictor_func(vec)
            abs_err = abs(predicted_capacity - ground_truth_safe)
            errors.append(abs_err)

            eval_points.append({
                "concurrent_users": target_users,
                "server_cpu_percent": round(cpu, 1),
                "latency_p99_ms": round(p99, 1),
                "ground_truth_safe_capacity": ground_truth_safe,
                "predicted_safe_capacity": predicted_capacity,
                "absolute_error_users": abs_err,
                "error_percent": round((abs_err / ground_truth_safe) * 100.0, 2),
            })

        critical_mae = float(np.mean(errors))
        max_error = int(np.max(errors))
        is_safe_under_stress = all(p["predicted_safe_capacity"] <= p["ground_truth_safe_capacity"] + 800 for p in eval_points)

        return {
            "critical_region_mae": round(critical_mae, 1),
            "critical_region_max_error": max_error,
            "boundary_stability_verdict": "STABLE_SAFE" if is_safe_under_stress else "AGGRESSIVE_OVERESTIMATE",
            "evaluation_steps": eval_points,
        }
