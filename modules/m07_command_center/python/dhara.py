"""
NIRANTAR Module 7 — Dhara Adaptive Self-Healing & Overload Control Engine
========================================================================
Provides automated threshold load shedding (Levels 0-3), auto-circuit trip on downstream timeouts,
auto-recovery when system load normalizes for >10 seconds, and comprehensive self-healing audit logging.
"""

from __future__ import annotations

from datetime import datetime, timezone
import threading
import time
from typing import Any, Dict, List, Optional

from backend.app.services.executor.circuit_breaker import CircuitBreaker, CircuitState
from contracts.command_center import SelfHealingLogEntry


class DharaSelfHealingEngine:
    """
    Adaptive Self-Healing & Load Shedding Control Engine.

    Load Shedding Levels:
      - Level 0 (NORMAL): All systems nominal. Standard operations, no load shedding.
      - Level 1 (MILD): Mild load shedding (non-critical analytics/search cached, light rate limiting).
      - Level 2 (MODERATE): High load. Virtual queue active, background jobs deferred, DB protection active.
      - Level 3 (SEVERE): Critical load/overload. Strict load shedding, non-critical requests dropped.
    """

    def __init__(self, circuit_breaker: Optional[CircuitBreaker] = None) -> None:
        self._lock = threading.Lock()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()
        self._current_level: int = 0
        self._auto_healing_enabled: bool = True
        self._manual_override_active: bool = False

        self._last_high_load_time: float = time.time()
        self._last_evaluation_time: float = time.time()
        self._normalized_since: Optional[float] = None
        self._recovery_hold_seconds: float = 10.0

        self._logs: List[SelfHealingLogEntry] = []
        self._max_logs: int = 200

        self._log_event(
            SelfHealingLogEntry(
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type="INITIALIZATION",
                description="Dhara Self-Healing Engine initialized at Level 0 (NORMAL).",
                old_level=0,
                new_level=0,
                telemetry_snapshot={},
            )
        )

    @property
    def current_level(self) -> int:
        with self._lock:
            return self._current_level

    @property
    def auto_healing_enabled(self) -> bool:
        with self._lock:
            return self._auto_healing_enabled

    def get_logs(self, limit: int = 50) -> List[SelfHealingLogEntry]:
        with self._lock:
            return list(reversed(self._logs[-limit:]))

    def set_load_shedding_level(
        self,
        level: int,
        reason: str = "Manual override",
        is_manual: bool = True,
        telemetry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Manually or programmatically set the load shedding level (0-3)."""
        level = max(0, min(3, level))
        with self._lock:
            old_level = self._current_level
            if is_manual:
                self._manual_override_active = True

            if old_level != level:
                self._current_level = level
                event_type = "MANUAL_LEVEL_CHANGE" if is_manual else "AUTO_LEVEL_CHANGE"
                desc = f"Load shedding level changed from {old_level} to {level}. Reason: {reason}"
                self._log_event(
                    SelfHealingLogEntry(
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        event_type=event_type,
                        description=desc,
                        old_level=old_level,
                        new_level=level,
                        telemetry_snapshot=telemetry or {},
                    )
                )

            return {
                "level": self._current_level,
                "auto_healing_enabled": self._auto_healing_enabled,
                "manual_override": self._manual_override_active,
                "active_policies": self._get_active_policies_unlocked(),
            }

    def toggle_auto_healing(self, enabled: bool, reason: str = "") -> Dict[str, Any]:
        """Enable or disable auto-healing control loop."""
        with self._lock:
            self._auto_healing_enabled = enabled
            if enabled:
                self._manual_override_active = False

            desc = f"Auto-healing {'enabled' if enabled else 'disabled'}. {reason}".strip()
            self._log_event(
                SelfHealingLogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    event_type="AUTO_HEALING_TOGGLED",
                    description=desc,
                    old_level=self._current_level,
                    new_level=self._current_level,
                    telemetry_snapshot={},
                )
            )
            return {
                "level": self._current_level,
                "auto_healing_enabled": self._auto_healing_enabled,
                "active_policies": self._get_active_policies_unlocked(),
            }

    def trip_circuit(self, reason: str = "Manual operator trip") -> Dict[str, Any]:
        """Trip downstream circuit breaker to OPEN."""
        with self._lock:
            self.circuit_breaker.trip(reason=reason)
            desc = f"Circuit breaker tripped OPEN. Reason: {reason}"
            self._log_event(
                SelfHealingLogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    event_type="CIRCUIT_TRIP",
                    description=desc,
                    old_level=self._current_level,
                    new_level=self._current_level,
                    telemetry_snapshot={},
                )
            )
            return self.circuit_breaker.get_status()

    def reset_circuit(self, reason: str = "Manual operator reset") -> Dict[str, Any]:
        """Reset downstream circuit breaker to CLOSED."""
        with self._lock:
            self.circuit_breaker.reset()
            desc = f"Circuit breaker reset to CLOSED. Reason: {reason}"
            self._log_event(
                SelfHealingLogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    event_type="CIRCUIT_RESET",
                    description=desc,
                    old_level=self._current_level,
                    new_level=self._current_level,
                    telemetry_snapshot={},
                )
            )
            return self.circuit_breaker.get_status()

    def _check_auto_circuit_trip(
        self,
        p95_ms: float,
        consecutive_timeouts: int,
        error_rate: float,
        telemetry: Dict[str, Any],
    ) -> None:
        if consecutive_timeouts < 3 and p95_ms < 2000.0 and error_rate < 50.0:
            return
        if self.circuit_breaker.state != CircuitState.CLOSED:
            return
        trip_reason = f"Auto-trip triggered: p95 latency={p95_ms:.1f}ms, consecutive_timeouts={consecutive_timeouts}, error_rate={error_rate:.1f}%"
        self.circuit_breaker.trip(reason=trip_reason)
        self._log_event(
            SelfHealingLogEntry(
                timestamp=datetime.now(timezone.utc).isoformat(),
                event_type="AUTO_CIRCUIT_TRIP",
                description=trip_reason,
                old_level=self._current_level,
                new_level=self._current_level,
                telemetry_snapshot=telemetry,
            )
        )

    def _evaluate_auto_recovery(
        self,
        target_level: int,
        now: float,
        cpu: float,
        p95_ms: float,
        db_queue: int,
        telemetry: Dict[str, Any],
    ) -> None:
        if target_level > self._current_level:
            old_level = self._current_level
            self._current_level = target_level
            self._normalized_since = None
            self._last_high_load_time = now
            desc = f"Auto-escalating load shedding level to Level {target_level} due to load spike (CPU={cpu:.1f}%, p95={p95_ms:.1f}ms, DB Queue={db_queue})."
            self._log_event(
                SelfHealingLogEntry(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    event_type="AUTO_ESCALATION",
                    description=desc,
                    old_level=old_level,
                    new_level=target_level,
                    telemetry_snapshot=telemetry,
                )
            )
            return

        if target_level < self._current_level:
            if self._normalized_since is None:
                self._normalized_since = now
            normalized_duration = now - self._normalized_since
            if normalized_duration >= self._recovery_hold_seconds:
                old_level = self._current_level
                self._current_level = max(0, self._current_level - 1)
                self._normalized_since = now
                desc = f"Auto-recovering load shedding level to Level {self._current_level} after {normalized_duration:.1f}s of normalized load."
                self._log_event(
                    SelfHealingLogEntry(
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        event_type="AUTO_RECOVERY",
                        description=desc,
                        old_level=old_level,
                        new_level=self._current_level,
                        telemetry_snapshot=telemetry,
                    )
                )
        elif target_level > 0:
            self._normalized_since = None

    def _calculate_target_level(
        self, cpu: float, p95_ms: float, db_queue: int, error_rate: float
    ) -> int:
        if cpu >= 85.0 or p95_ms >= 1000.0 or db_queue >= 150 or error_rate >= 25.0:
            return 3
        if cpu >= 75.0 or p95_ms >= 500.0 or db_queue >= 80 or error_rate >= 10.0:
            return 2
        if cpu >= 60.0 or p95_ms >= 300.0 or db_queue >= 30 or error_rate >= 4.0:
            return 1
        return 0

    def evaluate_telemetry(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main self-healing evaluation control loop.
        Consumes real-time telemetry and automatically adjusts load shedding levels,
        trips circuit breaker on downstream timeouts, and auto-recovers when load normalizes (>10s).
        """
        now = time.time()
        cpu = float(telemetry.get("cpu_percent") or 0.0)
        p95_ms = float(
            telemetry.get("p95_latency_ms")
            or telemetry.get("latency_p99_ms")
            or telemetry.get("latency_ms")
            or 0.0
        )
        db_queue = int(telemetry.get("db_queue_depth") or telemetry.get("queue_length") or 0)
        error_rate = float(
            telemetry.get("error_rate_pct")
            or (float(telemetry.get("error_rate") or 0.0) * 100.0)
        )
        consecutive_timeouts = int(telemetry.get("consecutive_timeouts") or 0)

        with self._lock:
            self._last_evaluation_time = now
            self._check_auto_circuit_trip(p95_ms, consecutive_timeouts, error_rate, telemetry)

            if not self._auto_healing_enabled:
                return self._get_status_unlocked()

            target_level = self._calculate_target_level(cpu, p95_ms, db_queue, error_rate)
            self._evaluate_auto_recovery(target_level, now, cpu, p95_ms, db_queue, telemetry)
            return self._get_status_unlocked()

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return self._get_status_unlocked()

    def _get_status_unlocked(self) -> Dict[str, Any]:
        return {
            "level": self._current_level,
            "auto_healing_enabled": self._auto_healing_enabled,
            "manual_override": self._manual_override_active,
            "circuit_breaker_state": self.circuit_breaker.state.value,
            "active_policies": self._get_active_policies_unlocked(),
        }

    def _get_active_policies_unlocked(self) -> List[str]:
        policies = []
        if self._current_level == 0:
            policies.append("LEVEL_0_NOMINAL: Full operational capacity, standard caching.")
        if self._current_level >= 1:
            policies.append("LEVEL_1_MILD: Cache non-critical search filters, light rate limits.")
        if self._current_level >= 2:
            policies.append(
                "LEVEL_2_MODERATE: Virtual queue active, non-critical background jobs deferred, DB protection enabled."
            )
        if self._current_level >= 3:
            policies.append("LEVEL_3_SEVERE: Max load shedding active, non-critical API endpoints dropped.")
        if self.circuit_breaker.state == CircuitState.OPEN:
            policies.append("CIRCUIT_OPEN: Intercepting downstream calls with Digital Twin fallback cache.")
        return policies

    def _log_event(self, entry: SelfHealingLogEntry) -> None:
        self._logs.append(entry)
        if len(self._logs) > self._max_logs:
            self._logs.pop(0)
