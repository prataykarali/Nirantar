"""
NIRANTAR Module 2 — Time-Series Future Demand Forecaster
========================================================
Forecasts incoming citizen & bot traffic volume across future time horizons:
+5 min, +10 min, +15 min, and +30 min, allowing proactive orchestration before overload.
"""

from typing import Any, Dict, List, Optional
import numpy as np


class FutureDemandForecaster:
    """Time-series multi-horizon demand forecasting engine."""

    def __init__(self) -> None:
        pass

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

        # Growth momentum factor
        # If user growth rate is high or Tatkal window is active, simulate exponential arrival
        if is_tatkal_window or user_growth_rate > 0.15:
            # Tatkal rush surge trajectory
            f5 = int(base_u * 1.56)   # e.g. 5,000 -> 7,800
            f10 = int(base_u * 1.88)  # e.g. 5,000 -> 9,400
            f15 = int(base_u * 2.24)  # e.g. 5,000 -> 11,200
            f30 = int(base_u * 2.80)  # e.g. 5,000 -> 14,000
        elif user_growth_rate < -0.05:
            # Cooling trajectory
            f5 = int(base_u * 0.92)
            f10 = int(base_u * 0.85)
            f15 = int(base_u * 0.80)
            f30 = int(base_u * 0.75)
        else:
            # Steady organic trajectory
            growth = max(0.01, user_growth_rate)
            f5 = int(base_u * (1.0 + growth * 1.5))
            f10 = int(base_u * (1.0 + growth * 2.8))
            f15 = int(base_u * (1.0 + growth * 4.0))
            f30 = int(base_u * (1.0 + growth * 6.5))

        # Expected future RPS
        rps_per_user = max(0.05, current_rps / base_u)
        rps_5 = round(f5 * rps_per_user, 1)
        rps_10 = round(f10 * rps_per_user, 1)
        rps_30 = round(f30 * rps_per_user, 1)

        # Determine if future demand will exceed capacity threshold (e.g. 10,000 users)
        will_overload_in_30m = f30 >= 10000
        time_to_overload = None
        if f5 >= 10000:
            time_to_overload = 5
        elif f10 >= 10000:
            time_to_overload = 10
        elif f15 >= 10000:
            time_to_overload = 15
        elif f30 >= 10000:
            time_to_overload = 30

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
