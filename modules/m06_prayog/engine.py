"""
PRAYOG in-process engine.

Generates virtual citizens, walks realistic journeys, injects lab chaos,
and asks: does DHARA still protect the critical citizen booking path?
"""

from __future__ import annotations

import json
import sys
from backend.app.services.simulation.prayog import (
    PrayogEngine,
    DynamicAdmissionTokenBucket,
    EdgeCDNCacheHeaderManager,
)

__all__ = [
    "PrayogEngine",
    "DynamicAdmissionTokenBucket",
    "EdgeCDNCacheHeaderManager",
]


def main() -> None:
    scenario = sys.argv[1] if len(sys.argv) > 1 else "NORMAL"
    population = int(sys.argv[2]) if len(sys.argv) > 2 else None
    engine = PrayogEngine()
    if str(scenario).upper() in {"D", "SUDDEN_SPIKE"}:
        summary = engine.run_spike(population_cap=population)
    else:
        summary = engine.run(scenario, population=population)
    sys.stdout.write(json.dumps(summary.model_dump(), indent=2) + "\n")


if __name__ == "__main__":
    main()
