"""Shared digital-twin + PRAYOG process state.

The citizen path, PRAYOG, and the Command Center must observe the same mock.
"""

from m0_digital_twin.railway_api import DigitalTwinRouter
from simulation.engine import PrayogEngine

twin = DigitalTwinRouter()
prayog = PrayogEngine(router=twin)
