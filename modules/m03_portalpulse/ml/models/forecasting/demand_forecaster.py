"""
NIRANTAR Module 2 — Time-Series Future Demand Forecaster
========================================================
Forecasts incoming citizen & bot traffic volume across future time horizons:
+5 min, +10 min, +15 min, and +30 min, allowing proactive orchestration before overload.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class FutureDemandForecaster:
    """Time-series multi-horizon demand forecasting engine."""

    def __init__(self) -> None:
        pass

    def _calculate_forecast_horizons(self, base_u: int, user_growth_rate: float, is_tatkal_window: bool) -> Tuple[int, int, int, int]:
        if is_tatkal_window or user_growth_rate > 0.15:
            return int(base_u * 1.56), int(base_u * 1.88), int(base_u * 2.24), int(base_u * 2.80)
        if user_growth_rate < -0.05:
            return int(base_u * 0.92), int(base_u * 0.85), int(base_u * 0.80), int(base_u * 0.75)
        growth = max(0.01, user_growth_rate)
        return (
            int(base_u * (1.0 + growth * 1.5)),
            int(base_u * (1.0 + growth * 2.8)),
            int(base_u * (1.0 + growth * 4.0)),
            int(base_u * (1.0 + growth * 6.5)),
        )

    def _estimate_time_to_overload(self, f5: int, f10: int, f15: int, f30: int) -> Optional[int]:
        if f5 >= 10000:
            return 5
        if f10 >= 10000:
            return 10
        if f15 >= 10000:
            return 15
        if f30 >= 10000:
            return 30
        return None

    def forecast_demand(
        self,
        current_users: int,
        user_growth_rate: float,
        current_rps: float,
        is_tatkal_window: bool = False,
    ) -> Dict[str, Any]:
        """
        Forecasts expected traffic at +5m, +10m, +15m, +30m.
        Example: Current = 5,000 -> +5m = 7,800 -> +10m = 9,400 -> +30m = 14,000
        """
        base_u = max(100, current_users)
        f5, f10, f15, f30 = self._calculate_forecast_horizons(base_u, user_growth_rate, is_tatkal_window)

        # Expected future RPS
        rps_per_user = max(0.05, current_rps / base_u)
        rps_5 = round(f5 * rps_per_user, 1)
        rps_10 = round(f10 * rps_per_user, 1)
        rps_30 = round(f30 * rps_per_user, 1)

        will_overload_in_30m = f30 >= 10000
        time_to_overload = self._estimate_time_to_overload(f5, f10, f15, f30)

        return {
            "current_users": base_u,
            "forecast_horizons": {
                "plus_5_min_users": f5,
                "plus_10_min_users": f10,
                "plus_15_min_users": f15,
                "plus_30_min_users": f30,
            },
            "forecast_rps": {
                "plus_5_min_rps": rps_5,
                "plus_10_min_rps": rps_10,
                "plus_30_min_rps": rps_30,
            },
            "will_overload_in_30m": will_overload_in_30m,
            "time_to_overload_minutes": time_to_overload,
            "recommended_proactive_action": "PREPARE_QUEUE_AND_PRE_WARM_CACHE" if will_overload_in_30m else "MAINTAIN_NORMAL_ROUTING",
        }
