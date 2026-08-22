"""8.4 Protected Citizen Transaction Rate."""

from __future__ import annotations

from typing import Iterable, List

from contracts.experiment import ResilienceMetrics
from contracts.simulation import CitizenOutcome, PersonaKind

CRITICAL = {
    PersonaKind.NORMAL,
    PersonaKind.RETURNING,
    PersonaKind.SLOW_MOBILE,
    PersonaKind.RETRY_HEAVY,
}
SUCCESS = {"completed", "queued"}


def from_outcomes(outcomes: Iterable[CitizenOutcome]) -> ResilienceMetrics:
    rows: List[CitizenOutcome] = list(outcomes)
    critical = [o for o in rows if o.persona in CRITICAL]
    ok = [o for o in critical if o.outcome in SUCCESS]
    blocked = [o for o in critical if o.outcome in {"dropped", "failed_chaos"}]
    contained = [
        o
        for o in rows
        if o.persona == PersonaKind.SUSPICIOUS and (o.throttled or o.outcome == "throttled")
    ]
    total = len(critical)
    rate = (len(ok) / total) if total else 0.0
    return ResilienceMetrics(
        successful_legitimate_critical=len(ok),
        total_legitimate_critical=total,
        protected_citizen_transaction_rate=round(rate, 4),
        legitimate_users_blocked=len(blocked),
        suspicious_traffic_contained=len(contained),
    )
