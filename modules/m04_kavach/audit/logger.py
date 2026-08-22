"""KAVACH — In-memory audit trail. Immutable audit logs, zero PII."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from contracts.security import AccessControlVerdict, SecurityAuditLog
from security.privacy.masking import sanitize_payload


class AuditLogger:
    """Immutable audit logging engine."""

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
        clean_metadata = sanitize_payload(metadata or {})
        event = SecurityAuditLog(
            actor_id=session_id,
            target_resource=resource,
            verdict=verdict,
            metadata=clean_metadata,
        )
        self._events.append(event)
        if len(self._events) > self._max:
            self._events = self._events[-self._max :]
        return event

    def recent(self, limit: int = 50, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve recent audit logs, optionally filtered by session_id."""
        events = self._events
        if session_id:
            events = [e for e in events if e.actor_id == session_id]
        return [e.model_dump() for e in events[-limit:]]

    def clear(self) -> None:
        self._events.clear()
