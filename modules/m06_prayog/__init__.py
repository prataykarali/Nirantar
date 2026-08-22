"""PRAYOG — synthetic users, traffic scenarios, and lab-only chaos."""

from typing import Any

__all__ = ["PrayogEngine"]


def __getattr__(name: str) -> Any:
    if name == "PrayogEngine":
        from simulation.engine import PrayogEngine

        return PrayogEngine
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
