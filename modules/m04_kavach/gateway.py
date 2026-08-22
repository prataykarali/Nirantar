"""
KAVACH gateway — single entry used by the citizen API.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

from contracts.security import AccessControlVerdict, SecurityAssessment
from security.audit.logger import AuditLogger
from security.controls.rate_limiter import SessionRateLimiter
from security.detection.classifier import TrustClassifier
from security.detection.profiler import SessionProfiler


class KavachGateway:
    def __init__(self) -> None:
        self.profiler = SessionProfiler()
        self.classifier = TrustClassifier()
        self.limiter = SessionRateLimiter()
        self.audit = AuditLogger()

    def evaluate(
        self,
        session_id: str,
        endpoint: str,
        ip_hash: str = "ip_hash_local",
        is_retry: bool = False,
    ) -> Tuple[SecurityAssessment, bool, str]:
        """Return (assessment, allowed, reason)."""
        profile = self.profiler.record(session_id, endpoint, is_retry=is_retry)
        assessment = self.classifier.assess(profile, ip_hash=ip_hash)
        max_rps = float(assessment.decision.throttle_rate_rps or 10.0)
        allowed, _remaining = self.limiter.allow(session_id, max_rps)
        verdict = assessment.decision.verdict

        if verdict == AccessControlVerdict.BLOCK:
            allowed = False
            reason = "blocked"
        elif not allowed:
            reason = "rate_limited"
        elif verdict == AccessControlVerdict.CAPTCHA_CHALLENGE:
            reason = "challenge"
        elif verdict == AccessControlVerdict.THROTTLE:
            reason = "throttled" if allowed else "rate_limited"
        elif assessment.decision.threat_score >= 0.3:
            reason = "monitor"
        else:
            reason = "allow"

        self.audit.record(
            session_id,
            endpoint,
            verdict,
            {
                "risk_score": assessment.decision.threat_score,
                "reason": reason,
                "allowed": allowed,
            },
        )
        return assessment, allowed or reason == "challenge", reason

    def dump(self, assessment: SecurityAssessment, reason: str) -> Dict[str, Any]:
        return {
            "risk_score": assessment.decision.threat_score,
            "verdict": assessment.decision.verdict.value,
            "category": assessment.decision.threat_category.value,
            "reason": reason,
            "factors": assessment.risk_factors,
            "allowed_rps": assessment.decision.throttle_rate_rps,
        }
