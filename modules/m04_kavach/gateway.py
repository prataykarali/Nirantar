"""
KAVACH Gateway — Central Entry & Security Evaluation Engine.
Wraps security evaluation flow, fair access limits, zero-PII sanitization, and immutable audit logs.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

from contracts.security import AccessControlVerdict, SecurityAssessment
from security.audit.logger import AuditLogger
from security.controls.rate_limiter import SessionRateLimiter
from security.detection.classifier import TrustClassifier
from security.detection.profiler import SessionProfiler
from security.privacy.masking import sanitize_payload


class KavachGateway:
    def __init__(self) -> None:
        self.profiler = SessionProfiler()
        self.classifier = TrustClassifier()
        self.limiter = SessionRateLimiter()
        self.audit = AuditLogger()

    def _determine_verdict_reason(
        self, verdict: AccessControlVerdict, allowed: bool, threat_score: float
    ) -> Tuple[bool, str]:
        if verdict == AccessControlVerdict.BLOCK:
            return False, "blocked"
        if not allowed:
            return False, "rate_limited"
        if verdict == AccessControlVerdict.CAPTCHA_CHALLENGE:
            return True, "challenge"
        if verdict == AccessControlVerdict.THROTTLE:
            return allowed, ("throttled" if allowed else "rate_limited")
        if threat_score >= 0.3:
            return allowed, "monitor"
        return allowed, "allow"

    def evaluate(
        self,
        session_id: str,
        endpoint: str,
        ip_hash: str = "ip_hash_local",
        is_retry: bool = False,
    ) -> Tuple[SecurityAssessment, bool, str]:
        """
        Evaluate incoming request session.
        Returns: (assessment: SecurityAssessment, allowed: bool, reason: str)
        """
        profile = self.profiler.record(session_id, endpoint, is_retry=is_retry)
        assessment = self.classifier.assess(profile, ip_hash=ip_hash)
        max_rps = float(assessment.decision.throttle_rate_rps or 10.0)
        allowed, _remaining = self.limiter.allow(session_id, max_rps)
        verdict = assessment.decision.verdict

        allowed, reason = self._determine_verdict_reason(verdict, allowed, assessment.decision.threat_score)

        self.audit.record(
            session_id=session_id,
            resource=endpoint,
            verdict=verdict,
            metadata={
                "risk_score": assessment.decision.threat_score,
                "reason": reason,
                "allowed": allowed,
            },
        )
        return assessment, allowed or reason == "challenge", reason

    def sanitize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Scrub sensitive PII fields from payload dictionary."""
        return sanitize_payload(payload)

    def dump(self, assessment: SecurityAssessment, reason: str) -> Dict[str, Any]:
        return {
            "risk_score": assessment.decision.threat_score,
            "verdict": assessment.decision.verdict.value,
            "category": assessment.decision.threat_category.value,
            "reason": reason,
            "factors": assessment.risk_factors,
            "allowed_rps": assessment.decision.throttle_rate_rps,
        }
