"""
DHARA — Decide what the system should do.
Consumes NOVA-style overload signals and KAVACH trust scores.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from contracts.orchestration import (
    LoadShedAction,
    OrchestrationDecision,
    QueueAction,
    QueuePolicy,
    RateLimitAction,
    ResilienceState,
)
from contracts.security import SecurityAssessment
from m0_digital_twin.dependency_graph import default_service_graph
from orchestrator.resilience.load_shed import LoadShedPolicy
from orchestrator.scheduling.priority_queue import PRIORITY, AdmissionQueue


class DharaEngine:
    def __init__(self) -> None:
        self.graph = default_service_graph()
        self.queue = AdmissionQueue()
        self.shed = LoadShedPolicy()
        self._inventory_stressed = False

    def mark_inventory_stress(self, stressed: bool) -> None:
        self._inventory_stressed = stressed

    def critical_path(self, target: str = "BookingEngine") -> Dict[str, Any]:
        return self.graph.compute_critical_path(target)

    def decide(
        self,
        assessment: Optional[SecurityAssessment] = None,
        overload_probability: float = 0.0,
        suspicious_sessions: int = 0,
        endpoint: str = "SEARCH",
        session_id: str = "SES-local",
        target_service: str = "BookingEngine",
        enqueue: bool = True,
    ) -> OrchestrationDecision:
        risk = assessment.decision.threat_score if assessment else 0.0
        overloaded = overload_probability >= 0.75 or self.queue.depth() > 200
        inventory_critical = self._inventory_stressed or any(
            name == "SeatInventoryDB" and node.health < 0.5
            for name, node in self.graph.nodes.items()
        )

        if overload_probability >= 0.9 or inventory_critical:
            state = ResilienceState.LOAD_SHEDDING
        elif overloaded:
            state = ResilienceState.QUEUE_ACTIVATED
        elif risk >= 0.6 or suspicious_sessions > 500:
            state = ResilienceState.ELEVATED_MONITORING
        else:
            state = ResilienceState.NORMAL

        should_enqueue = state in {
            ResilienceState.QUEUE_ACTIVATED,
            ResilienceState.LOAD_SHEDDING,
        }
        queue_meta: Dict[str, Any] = {}
        if should_enqueue and enqueue:
            queue_meta = self.queue.enqueue(session_id, endpoint)
        elif should_enqueue:
            category = self.queue.classify(endpoint)
            queue_meta = {"enqueued": True, "priority": PRIORITY.get(category, 3)}

        disabled = self.shed.features_to_disable(overloaded, inventory_critical)
        reasons = [
            f"overload_probability={overload_probability:.2f}",
            f"kavach_risk={risk:.2f}",
            f"suspicious_sessions={suspicious_sessions}",
        ]
        if inventory_critical:
            reasons.append("protect_inventory_db")

        return OrchestrationDecision(
            target_service=target_service,
            current_state=state,
            trigger_reason="; ".join(reasons),
            queue=QueueAction(
                policy=QueuePolicy.PRIORITY_FAIR,
                should_enqueue=should_enqueue,
                priority_level=int(queue_meta.get("priority") or 3),
                max_queue_depth=self.queue.max_depth,
                target_service=target_service,
            ),
            load_shed=LoadShedAction(
                shed_non_critical=overloaded,
                drop_unauthenticated=risk >= 0.8,
                serve_cached_inventory=inventory_critical or overloaded,
                disabled_features=disabled,
            ),
            rate_limit=RateLimitAction(
                global_rate_multiplier=0.4 if overloaded else 1.0,
                per_ip_limit_rps=2 if risk >= 0.6 else 10,
                suspicious_bucket_rps=2,
            ),
            database_protection_enabled=inventory_critical or overloaded,
            cache_ttl_seconds=120 if overloaded else 30,
        )

    def dump(self, decision: OrchestrationDecision) -> Dict[str, Any]:
        return {
            "state": decision.current_state.value,
            "reason": decision.trigger_reason,
            "enqueue": decision.queue.should_enqueue,
            "protect_db": decision.database_protection_enabled,
            "disabled": decision.load_shed.disabled_features,
            "critical_path": self.critical_path().get("critical_path"),
        }
