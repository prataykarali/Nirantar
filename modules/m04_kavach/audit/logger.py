"""KAVACH — In-memory audit trail. No real citizen identifiers."""

from __future__ import annotations

from typing import Any, Dict, List

from contracts.security import AccessControlVerdict, SecurityAuditLog


class AuditLogger:
    def __init__(self, max_events: int = 2000) -> None:
        self._events: List[SecurityAuditLog] = []
        self._max = max_events

    def record(
        self,
        session_id: str,
        resource: str,
        verdict: AccessControlVerdict,
        metadata: Dict[str, Any] | None = None,
    ) -> SecurityAuditLog:
        event = SecurityAuditLog(
            actor_id=session_id,
            target_resource=resource,
            verdict=verdict,
            metadata=metadata or {},
        )
        self._events.append(event)
        if len(self._events) > self._max:
            self._events = self._events[-self._max :]
        return event

    def recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [e.model_dump() for e in self._events[-limit:]]
