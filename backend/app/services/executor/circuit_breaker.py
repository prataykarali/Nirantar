"""
NIRANTAR Module 4 — 3-State Resilient Circuit Breaker & Fallback Engine
======================================================================
Implements a thread-safe 3-state CircuitBreaker (CLOSED, OPEN, HALF_OPEN)
tracking failure rates, consecutive timeouts, and recovery probe intervals.
Provides automatic fallback dispatch serving cached Digital Twin inventory when OPEN.
"""

from datetime import datetime, timezone
from enum import Enum
import threading
import time
from typing import Any, Dict, List, Optional

from backend.app.core.runtime import twin
from m0_digital_twin.database import get_db


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    3-State Circuit Breaker enforcing system resilience and stability.

    States:
      - CLOSED: Normal operation. All requests allowed through.
      - OPEN: Downstream degraded/failed. Requests intercepted and served via Digital Twin Fallback.
      - HALF_OPEN: Recovery probe phase. Limited requests allowed to test downstream health.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        consecutive_timeout_threshold: int = 3,
        recovery_timeout: float = 5.0,
        half_open_success_threshold: int = 2,
    ) -> None:
        self.failure_threshold = failure_threshold
        self.consecutive_timeout_threshold = consecutive_timeout_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold

        self._lock = threading.Lock()
        self._state: CircuitState = CircuitState.CLOSED
        self._consecutive_failures: int = 0
        self._consecutive_timeouts: int = 0
        self._half_open_successes: int = 0
        self._total_calls: int = 0
        self._total_failures: int = 0
        self._total_successes: int = 0
        self._total_fallbacks: int = 0
        self._last_failure_time: Optional[float] = None
        self._last_state_change_time: float = time.time()
        self._trip_reason: str = "Normal operation"

    @property
    def state(self) -> CircuitState:
        with self._lock:
            self._evaluate_state_transition()
            return self._state

    def _evaluate_state_transition(self) -> None:
        """Internal helper to check recovery probe interval when OPEN (must be called within lock)."""
        if self._state != CircuitState.OPEN or self._last_failure_time is None:
            return

        elapsed = time.time() - self._last_failure_time
        if elapsed >= self.recovery_timeout:
            self._state = CircuitState.HALF_OPEN
            self._half_open_successes = 0
            self._last_state_change_time = time.time()
            self._trip_reason = f"Recovery timeout ({self.recovery_timeout}s) elapsed; probing in HALF_OPEN state."

    def can_execute(self) -> bool:
        """
        Determine if request execution is permitted through the circuit breaker.
        Returns True for CLOSED or HALF_OPEN (probe), False for OPEN.
        """
        with self._lock:
            self._evaluate_state_transition()
            return self._state in (CircuitState.CLOSED, CircuitState.HALF_OPEN)

    def record_success(self) -> None:
        """Record a successful execution downstream."""
        with self._lock:
            self._total_calls += 1
            self._total_successes += 1
            self._evaluate_state_transition()

            if self._state == CircuitState.HALF_OPEN:
                self._half_open_successes += 1
                if self._half_open_successes >= self.half_open_success_threshold:
                    self._state = CircuitState.CLOSED
                    self._consecutive_failures = 0
                    self._consecutive_timeouts = 0
                    self._half_open_successes = 0
                    self._last_state_change_time = time.time()
                    self._trip_reason = f"Recovered to CLOSED after {self.half_open_success_threshold} successful probes."
            elif self._state == CircuitState.CLOSED:
                self._consecutive_failures = 0
                self._consecutive_timeouts = 0
                self._consecutive_failures = 0
                self._consecutive_timeouts = 0

    def _check_and_update_trip_reason(self, now: float, reason: str) -> None:
        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            self._half_open_successes = 0
            self._last_state_change_time = now
            self._trip_reason = f"Recovery probe failed in HALF_OPEN state: {reason}"
            return

        if self._state == CircuitState.CLOSED:
            should_trip = (
                self._consecutive_failures >= self.failure_threshold
                or self._consecutive_timeouts >= self.consecutive_timeout_threshold
            )
            if should_trip:
                self._state = CircuitState.OPEN
                self._last_state_change_time = now
                if self._consecutive_timeouts >= self.consecutive_timeout_threshold:
                    self._trip_reason = f"Tripped: {self._consecutive_timeouts} consecutive timeouts reached threshold ({self.consecutive_timeout_threshold})."
                else:
                    self._trip_reason = f"Tripped: {self._consecutive_failures} consecutive failures reached threshold ({self.failure_threshold})."

    def record_failure(self, is_timeout: bool = False, reason: str = "Downstream failure") -> None:
        """Record a downstream failure or timeout."""
        with self._lock:
            self._total_calls += 1
            self._total_failures += 1
            self._consecutive_failures += 1
            if is_timeout:
                self._consecutive_timeouts += 1

            now = time.time()
            self._last_failure_time = now
            self._check_and_update_trip_reason(now, reason)

    def trip(self, reason: str = "Manual trip requested") -> None:
        """Manually trip the circuit breaker into OPEN state."""
        with self._lock:
            now = time.time()
            self._state = CircuitState.OPEN
            self._last_state_change_time = now
            self._trip_reason = f"Manual trip: {reason}"

    def reset(self) -> None:
        """Reset the circuit breaker to CLOSED state."""
        with self._lock:
            now = time.time()
            self._state = CircuitState.CLOSED
            self._consecutive_failures = 0
            self._consecutive_timeouts = 0
            self._half_open_successes = 0
            self._last_state_change_time = now
            self._trip_reason = "Manual reset to CLOSED."

    def get_status(self) -> Dict[str, Any]:
        """Get snapshot of current circuit breaker status and metrics."""
        with self._lock:
            self._evaluate_state_transition()
            now = time.time()
            time_in_state = round(now - self._last_state_change_time, 2)
            time_until_probe = 0.0
            if self._state == CircuitState.OPEN and self._last_failure_time is not None:
                remaining = self.recovery_timeout - (now - self._last_failure_time)
                time_until_probe = max(0.0, round(remaining, 2))

            return {
                "state": self._state.value,
                "can_execute": self._state in (CircuitState.CLOSED, CircuitState.HALF_OPEN),
                "consecutive_failures": self._consecutive_failures,
                "consecutive_timeouts": self._consecutive_timeouts,
                "failure_threshold": self.failure_threshold,
                "timeout_threshold": self.consecutive_timeout_threshold,
                "recovery_timeout_seconds": self.recovery_timeout,
                "half_open_success_threshold": self.half_open_success_threshold,
                "half_open_successes": self._half_open_successes,
                "total_calls": self._total_calls,
                "total_failures": self._total_failures,
                "total_successes": self._total_successes,
                "total_fallbacks": self._total_fallbacks,
                "time_in_current_state_seconds": time_in_state,
                "time_until_recovery_probe_seconds": time_until_probe,
                "last_trip_reason": self._trip_reason,
            }

    def _fallback_search_train(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = get_db()
        source = payload.get("source", "NDLS")
        destination = payload.get("destination", "HWH")
        trains = db.search_trains(source, destination)
        return {
            "data": trains,
            "meta": {
                "source_station": source,
                "destination_station": destination,
                "count": len(trains),
                "notice": "Results served from local Digital Twin cache due to high load / circuit protection.",
            },
        }

    def _fallback_filter_results(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raw_results = payload.get("results", [])
        class_filter = payload.get("class_type")
        max_fare = payload.get("max_fare")

        filtered = raw_results if isinstance(raw_results, list) else []
        if class_filter and isinstance(raw_results, list):
            filtered = [t for t in filtered if isinstance(t, dict) and t.get("class_type") == class_filter]
        if max_fare is not None and isinstance(raw_results, list):
            filtered = [t for t in filtered if isinstance(t, dict) and t.get("fare", 0) <= max_fare]

        return {"data": filtered, "meta": {"count": len(filtered)}}

    def _fallback_focus_element(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        element_id = payload.get("element_id", "search-submit-btn")
        step_name = payload.get("step_name", "SEARCH")
        return {
            "data": {
                "focused_element_id": element_id,
                "step_name": step_name,
                "a11y_announcement": f"Focus moved to {element_id} in {step_name} step.",
                "client_action": "FOCUS",
            }
        }

    def _fallback_prepare_autofill(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "data": {
                "safe_autofill_fields": ["preferred_language", "quota", "class_type"],
                "default_values": {"preferred_language": "hi", "quota": "GN", "class_type": "3A"},
                "zero_pii_guarantee": True,
            }
        }

    def _fallback_explain_payment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        term = payload.get("term", "UPI")
        return {
            "data": {
                "term": term,
                "explanation": f"Fallback explanation for {term}: Payment processing handles digital transactions securely through synthetic banking gateways.",
                "recovery_hint": "If experiencing payment gateway timeouts, cached status confirms your transaction queue position is preserved.",
            }
        }

    def _fallback_check_payment_status(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        booking_id = payload.get("booking_id", "BKG-0001")
        return {
            "data": {
                "booking_id": booking_id,
                "status": "PROCESSING_SAFE",
                "payment_status": "PENDING_VERIFICATION",
                "estimated_resolution_seconds": 15,
                "inventory_locked": True,
            }
        }

    def execute_fallback(self, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback dispatch serving cached Digital Twin inventory when circuit is OPEN or degraded.
        """
        with self._lock:
            self._total_fallbacks += 1

        clean_action = (action or "").strip().lower()
        timestamp = datetime.now(timezone.utc).isoformat()

        fallback_dispatchers = {
            "search_train": self._fallback_search_train,
            "filter_results": self._fallback_filter_results,
            "focus_element": self._fallback_focus_element,
            "prepare_autofill": self._fallback_prepare_autofill,
            "explain_payment": self._fallback_explain_payment,
            "check_payment_status": self._fallback_check_payment_status,
        }

        handler = fallback_dispatchers.get(clean_action)
        if handler is not None:
            content = handler(payload)
        else:
            content = {
                "data": payload,
                "meta": {"notice": f"Generic Digital Twin fallback served for {clean_action}."},
            }

        res = {
            "status": 200,
            "action": clean_action,
            "fallback_served": True,
            "circuit_breaker_state": self.state.value,
            "source": "DIGITAL_TWIN_CACHE",
            "timestamp": timestamp,
            "data": content.get("data"),
        }
        if "meta" in content:
            res["meta"] = content["meta"]
        return res
