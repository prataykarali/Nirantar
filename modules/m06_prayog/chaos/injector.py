"""Apply chaos to the digital-twin router. Never used against live government APIs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from contracts.simulation import ChaosFailureMode, ChaosInjectionConfig
from m0_digital_twin.railway_api import DigitalTwinRouter
from m0_digital_twin.telemetry_emitter import SimulationScenario

OUTAGE_PATHS = {
    "SeatInventoryDB": ("/api/v0/availability", "/api/v0/booking/initiate"),
    "PaymentGateway": ("/api/v0/booking/initiate",),
    "AuthService": ("/api/v0/booking/initiate",),
    "SearchService": ("/api/v0/trains/search",),
}


@dataclass
class ChaosRuntime:
    """Mutable fault state read by DigitalTwinRouter.handle_request."""

    active: bool = False
    sleep: bool = False
    network_latency_ms: float = 0.0
    db_latency_ms: float = 0.0
    api_error_rate: float = 0.0
    outage_service: str = ""
    cpu_degraded: bool = False
    db_latency_multiplier: float = 1.0


class ChaosInjector:
    """Deterministic fault injector for PRAYOG lab runs."""

    def __init__(self, router: DigitalTwinRouter) -> None:
        self.router = router
        if not hasattr(router, "chaos"):
            router.chaos = ChaosRuntime()
        self.runtime: ChaosRuntime = router.chaos

    def reset(self) -> None:
        self.runtime = ChaosRuntime()
        self.router.chaos = self.runtime
        self.router.payment.failure_rate = 0.05
        self.router.payment.timeout_rate = 0.02
        self.router.payment.base_latency_ms = 65.0
        for node in self.router.graph.nodes.values():
            node.health = 1.0
            original = getattr(node, "_prayog_base_latency", None)
            if original is not None:
                node.base_latency_ms = original

    def apply(self, config: ChaosInjectionConfig, sleep: bool = False) -> ChaosRuntime:
        """Mutate router + runtime from a chaos config."""
        self.reset()
        self.runtime.sleep = sleep
        self.runtime.active = config.failure_mode != ChaosFailureMode.NONE
        mode = config.failure_mode
        if mode in {ChaosFailureMode.LATENCY_INJECTION, ChaosFailureMode.NETWORK_LATENCY}:
            self._network(config.injected_latency_ms or 200.0)
        elif mode in {ChaosFailureMode.DATABASE_LOCK, ChaosFailureMode.DATABASE_SLOWDOWN}:
            self._db_slow(config.injected_latency_ms or 100.0)
        elif mode == ChaosFailureMode.CPU_SATURATION:
            self._cpu()
        elif mode == ChaosFailureMode.API_FAILURE:
            self._api_fail(config.forced_error_rate or 0.4)
        elif mode == ChaosFailureMode.SERVICE_UNRESPONSIVE:
            self._outage(config.target_service)
        elif mode == ChaosFailureMode.TRAFFIC_SPIKE:
            self.runtime.active = True
        return self.runtime

    def snapshot(self) -> Dict[str, Any]:
        r = self.runtime
        return {
            "active": r.active,
            "network_latency_ms": r.network_latency_ms,
            "db_latency_ms": r.db_latency_ms,
            "db_latency_multiplier": r.db_latency_multiplier,
            "api_error_rate": r.api_error_rate,
            "outage_service": r.outage_service,
            "cpu_degraded": r.cpu_degraded,
        }

    def _network(self, ms: float) -> None:
        self.runtime.network_latency_ms = ms
        self.router.payment.base_latency_ms = 65.0 + ms

    def _db_slow(self, extra_ms: float) -> None:
        self.runtime.db_latency_ms = extra_ms
        self.runtime.db_latency_multiplier = 5.0 if extra_ms >= 80 else 2.0
        node = self.router.graph.nodes.get("SeatInventoryDB")
        if node:
            node.health = 0.4
            if not hasattr(node, "_prayog_base_latency"):
                node._prayog_base_latency = node.base_latency_ms
            node.base_latency_ms = node._prayog_base_latency * self.runtime.db_latency_multiplier

    def _cpu(self) -> None:
        self.runtime.cpu_degraded = True
        self.router.emitter.set_scenario(SimulationScenario.TATKAL_RUSH)

    def _api_fail(self, rate: float) -> None:
        self.runtime.api_error_rate = rate
        self.router.payment.failure_rate = min(1.0, rate)
        self.router.payment.timeout_rate = min(1.0, rate / 2.0)

    def _outage(self, service: str) -> None:
        self.runtime.outage_service = service
        node = self.router.graph.nodes.get(service)
        if node:
            node.health = 0.0
        self.router.graph.simulate_failure(service)


def path_is_outage(runtime: Optional[ChaosRuntime], path: str) -> bool:
    if runtime is None or not runtime.outage_service:
        return False
    return path in OUTAGE_PATHS.get(runtime.outage_service, ())
