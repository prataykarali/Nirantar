"""
NIRANTAR Module 7 — Dynamic Command Center Orchestrator
======================================================
Aggregates real-time system telemetry (CPU/RAM, active citizens, RPS throughput, p95 latency,
DB queue depth, circuit breaker state, threat mitigation rate) and controls system resilience.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from backend.app.core.runtime import prayog, twin
from backend.app.services.command_center.dhara import DharaSelfHealingEngine
from backend.app.services.executor.dispatcher import dispatcher
from backend.app.services.prediction.predictor import UnifiedPredictiveService
from contracts.command_center import (
    CommandCenterSnapshot,
    ForecastState,
    GraphNodeState,
    LiveSystemState,
    RecommendedAction,
    SecurityState,
    TimelineEvent,
)
from contracts.telemetry import TelemetryEvent
from m0_digital_twin.telemetry_emitter import SimulationScenario
from simulation.scenarios.catalog import get_scenario
from simulation.walker import overload_probability

CONTROL_NODES = (
    ("AuthService", "AUTH"),
    ("BookingEngine", "BOOKING"),
    ("SeatInventoryDB", "DB"),
    ("PaymentGateway", "PAYMENT"),
)

SCENARIO_TELEMETRY = {
    "NORMAL": SimulationScenario.NORMAL_DAYTIME,
    "PEAK": SimulationScenario.TATKAL_RUSH,
    "EXTREME": SimulationScenario.TATKAL_RUSH,
    "SUDDEN_SPIKE": SimulationScenario.TATKAL_RUSH,
    "BOT_SURGE": SimulationScenario.BOT_ATTACK,
    "INFRA_DEGRADATION": SimulationScenario.BACKEND_FAILURE,
}


class CommandCenterOrchestrator:
    """
    Central Orchestrator for NIRANTAR Command Center.
    Aggregates real-time telemetry metrics and coordinates Dhara adaptive self-healing.
    """

    def __init__(self, dhara_engine: Optional[DharaSelfHealingEngine] = None) -> None:
        self.predictor = UnifiedPredictiveService()
        self.dhara = dhara_engine or DharaSelfHealingEngine(circuit_breaker=dispatcher.circuit_breaker)
        self._timeline: List[TimelineEvent] = []
        self._scenario = "NORMAL"
        self._timeline_key = ""

    def collect_telemetry(self) -> Dict[str, Any]:
        """
        Aggregate real-time system telemetry across system components:
          - CPU/RAM usage
          - Active citizens (concurrent users)
          - RPS throughput (requests per sec)
          - p95 latency (ms)
          - DB queue depth
          - Circuit breaker state
          - Threat mitigation rate
        """
        m = self._booking_metrics()
        event = self._to_event(m)

        # Active citizens / users
        users = event.concurrent_users
        if prayog.last_run is not None:
            users = max(users, prayog.last_run.target_virtual_users)

        # Latency p95
        p95_ms = float(event.latency_p99_ms if event.latency_p99_ms > 0 else event.latency_p50_ms * 1.5)

        # DB queue depth
        db_queue = max(event.queue_length, prayog.dhara.queue.depth())

        # Circuit breaker state
        cb_state = dispatcher.circuit_breaker.state.value

        # Threat mitigation rate calculation
        sec = self._security(users)
        total_threats = sec.suspicious + sec.blocked + sec.throttled
        mitigated = sec.blocked + sec.throttled
        threat_rate = round(float(mitigated / total_threats), 2) if total_threats > 0 else 1.0

        return {
            "service_name": event.service_name,
            "timestamp": event.timestamp,
            "cpu_percent": round(event.cpu_percent, 1),
            "ram_percent": round(event.ram_percent, 1),
            "concurrent_users": users,
            "active_citizens": users,
            "requests_per_sec": round(event.requests_per_sec, 1),
            "throughput_rps": round(event.throughput_rps, 1),
            "p95_latency_ms": round(p95_ms, 1),
            "latency_ms": round(p95_ms, 1),
            "error_rate_pct": round(event.error_rate * 100.0, 1),
            "db_queue_depth": db_queue,
            "circuit_breaker_state": cb_state,
            "threat_mitigation_rate": threat_rate,
            "consecutive_timeouts": dispatcher.circuit_breaker.get_status().get("consecutive_timeouts", 0),
        }

    def snapshot(self) -> CommandCenterSnapshot:
        """
        Generate unified command center snapshot and trigger self-healing telemetry evaluation.
        """
        telemetry = self.collect_telemetry()
        # Feed telemetry to DharaSelfHealingEngine
        self.dhara.evaluate_telemetry(telemetry)

        metrics = self._booking_metrics()
        event = self._to_event(metrics)
        capacity = self.predictor.predict_safe_capacity(event)
        tatkal = self._scenario in {"PEAK", "EXTREME", "SUDDEN_SPIKE", "BOT_SURGE"}
        demand = self.predictor.forecast_demand(event, is_tatkal=tatkal)
        
        live = LiveSystemState(
            concurrent_users=int(telemetry["concurrent_users"]),
            requests_per_sec=float(telemetry["requests_per_sec"]),
            cpu_percent=float(telemetry["cpu_percent"]),
            latency_ms=float(telemetry["p95_latency_ms"]),
            error_rate_pct=float(telemetry["error_rate_pct"]),
            ram_percent=float(telemetry["ram_percent"]),
            p95_latency_ms=float(telemetry["p95_latency_ms"]),
            db_queue_depth=int(telemetry["db_queue_depth"]),
            circuit_breaker_state=str(telemetry["circuit_breaker_state"]),
            threat_mitigation_rate=float(telemetry["threat_mitigation_rate"]),
        )

        forecast = self._forecast(live, capacity, demand)
        security = self._security(live.concurrent_users)
        nodes, bottleneck, detail = self._graph()
        db_slow = any(n.id == "SeatInventoryDB" and n.health < 0.5 for n in nodes)
        overload = overload_probability(
            live.concurrent_users, db_slow=db_slow, cpu=live.cpu_percent >= 75
        )
        decision = prayog.dhara.decide(
            overload_probability=overload,
            suspicious_sessions=security.suspicious,
            endpoint="BOOK",
            session_id="SES-command-center",
            enqueue=False,
        )
        actions = self._actions(decision)
        self._refresh_timeline(decision.current_state.value, forecast, bottleneck)

        dhara_status = self.dhara.get_status()

        return CommandCenterSnapshot(
            live=live,
            forecast=forecast,
            security=security,
            nodes=nodes,
            bottleneck=bottleneck,
            bottleneck_detail=detail,
            actions=actions,
            timeline=list(self._timeline),
            dhara_state=decision.current_state.value,
            dhara_level=int(dhara_status.get("level", 0)),
            auto_healing_enabled=bool(dhara_status.get("auto_healing_enabled", True)),
            scenario=self._scenario,
            prayog_users=prayog.last_run.simulated_users if prayog.last_run else 0,
        )

    def run_scenario(self, scenario: str, population: int = 120) -> CommandCenterSnapshot:
        """Run simulation scenario and re-evaluate system state."""
        cfg = get_scenario(scenario)
        key = cfg.kind.value
        self._scenario = key
        telem = SCENARIO_TELEMETRY.get(key, SimulationScenario.NORMAL_DAYTIME)
        twin.emitter.set_scenario(telem)
        if cfg.kind.value == "SUDDEN_SPIKE":
            prayog.run_spike(population_cap=population)
        else:
            prayog.run(cfg.kind, population=population)
        self._timeline = []
        self._timeline_key = ""
        return self.snapshot()

    def _booking_metrics(self) -> Dict[str, Any]:
        raw = twin.handle_request("GET", "/api/v0/telemetry/snapshot")
        rows = raw.get("data") or []
        for row in rows:
            if row.get("service_name") == "BookingEngine":
                return row
        return rows[0] if rows else {}

    def _to_event(self, m: Dict[str, Any]) -> TelemetryEvent:
        return TelemetryEvent(
            service_name=str(m.get("service_name") or "BookingEngine"),
            timestamp=str(m.get("timestamp") or datetime.now(timezone.utc).isoformat()),
            requests_per_sec=float(m.get("requests_per_sec") or 0.0),
            concurrent_users=int(m.get("concurrent_users") or 0),
            cpu_percent=float(m.get("cpu_percent") or 0.0),
            ram_percent=float(m.get("ram_percent") or 0.0),
            network_mbps=float(m.get("network_mbps") or 0.0),
            latency_p50_ms=float(m.get("latency_p50_ms") or 0.0),
            latency_p99_ms=float(m.get("latency_p99_ms") or 0.0),
            error_rate=float(m.get("error_rate") or 0.0),
            queue_length=int(m.get("queue_length") or 0),
            throughput_rps=float(m.get("throughput_rps") or 0.0),
        )

    def _forecast(
        self,
        live: LiveSystemState,
        capacity: Dict[str, Any],
        demand: Dict[str, Any],
    ) -> ForecastState:
        horizons = demand.get("forecast_horizons") or {}
        plus5 = int(horizons.get("plus_5_min_users") or live.concurrent_users)
        plus10 = int(horizons.get("plus_10_min_users") or plus5)
        safe = int(capacity.get("predicted_safe_capacity_users") or 9600)
        seconds = _seconds_to_overload(live.concurrent_users, plus5, plus10, safe)
        return ForecastState(
            current_users=live.concurrent_users,
            plus_5_min_users=plus5,
            plus_10_min_users=plus10,
            safe_capacity_users=safe,
            overload_predicted=seconds is not None,
            overload_in_seconds=seconds,
        )

    def _security(self, users: int) -> SecurityState:
        last = prayog.last_run
        if last is not None:
            suspicious = last.verdict.suspicious_total
            throttled = last.verdict.suspicious_throttled
            dropped = int(last.outcomes.get("dropped", 0))
            legitimate = max(0, last.simulated_users - suspicious)
            scale = users / max(last.simulated_users, 1)
            return SecurityState(
                legitimate=int(legitimate * scale),
                suspicious=int(suspicious * scale),
                blocked=int(dropped * scale),
                throttled=int(throttled * scale),
            )
        suspicious = int(users * 0.063)
        return SecurityState(
            legitimate=max(0, users - suspicious),
            suspicious=suspicious,
            blocked=int(users * 0.025),
            throttled=int(users * 0.038),
        )

    def _graph(self) -> tuple[List[GraphNodeState], str, str]:
        nodes: List[GraphNodeState] = []
        worst_id, worst_health = "BookingEngine", 1.0
        for svc, label in CONTROL_NODES:
            node = twin.graph.nodes.get(svc)
            health = float(node.health) if node else 1.0
            status = "healthy" if health >= 0.8 else ("degraded" if health >= 0.5 else "down")
            nodes.append(GraphNodeState(id=svc, label=label, health=health, status=status))
            if health < worst_health:
                worst_id, worst_health = svc, health
        bottleneck = worst_id if worst_health < 0.8 else ""
        detail = ""
        if worst_id == "SeatInventoryDB" and worst_health < 0.8:
            detail = "Inventory DB is the bottleneck."
        elif bottleneck:
            detail = f"{bottleneck} is the bottleneck."
        return nodes, bottleneck, detail

    def _actions(self, decision: Any) -> List[RecommendedAction]:
        return [
            RecommendedAction(
                id="queue",
                label="Activate virtual queue",
                active=bool(decision.queue.should_enqueue),
            ),
            RecommendedAction(
                id="protect_db",
                label="Protect Inventory DB",
                active=bool(decision.database_protection_enabled),
            ),
            RecommendedAction(
                id="throttle",
                label="Throttle suspicious sessions",
                active=decision.rate_limit.suspicious_bucket_rps <= 2
                and decision.current_state.value != "NORMAL",
            ),
            RecommendedAction(
                id="cache",
                label="Enable caching",
                active=decision.cache_ttl_seconds >= 120,
            ),
            RecommendedAction(
                id="defer",
                label="Defer non-critical requests",
                active=bool(decision.load_shed.shed_non_critical or decision.load_shed.disabled_features),
            ),
        ]

    def _refresh_timeline(self, state: str, forecast: ForecastState, bottleneck: str) -> None:
        key = f"{self._scenario}:{state}:{bottleneck}:{forecast.overload_predicted}"
        if key == self._timeline_key and self._timeline:
            return
        self._timeline_key = key
        now = datetime.now()
        if state == "NORMAL" and not forecast.overload_predicted:
            self._timeline = [
                TimelineEvent(at=_clock(now), label="System within safe capacity", kind="ok")
            ]
            return
        stamps = [-12, -9, -7, -5, -4, 0]
        labels = [
            ("Demand spike detected", "detect"),
            ("Anomaly detected", "detect"),
            ("Overload predicted", "predict"),
            ("Virtual queue activated", "decide"),
            ("Suspicious traffic throttled", "decide"),
            (
                "DB load stabilized" if bottleneck else f"DHARA {state}",
                "stabilize",
            ),
        ]
        self._timeline = [
            TimelineEvent(at=_clock(now + timedelta(seconds=delta)), label=text, kind=kind)
            for delta, (text, kind) in zip(stamps, labels)
        ]


def _clock(moment: datetime) -> str:
    return moment.strftime("%H:%M:%S")


def _seconds_to_overload(current: int, plus5: int, plus10: int, safe: int) -> Optional[int]:
    if current >= safe:
        return 0
    if plus5 > current:
        rate = (plus5 - current) / 300.0
    elif plus10 > current:
        rate = (plus10 - current) / 600.0
    else:
        return None
    if rate <= 0:
        return None
    seconds = int((safe - current) / rate)
    if seconds > 1800:
        return None
    return max(0, seconds)
