"""
KAVACH — Adaptive trust classifier.
Scores sessions. Never auto-blocks a citizen below the high-risk band.
"""

from __future__ import annotations

from typing import List, Tuple

from contracts.security import (
    AccessControlVerdict,
    SecurityAssessment,
    ThreatCategory,
    ThreatDecision,
)
from security.detection.profiler import SessionProfile


class TrustClassifier:
    """Map behaviour → risk_score → adaptive verdict."""

    def score(self, profile: SessionProfile) -> Tuple[float, List[str], ThreatCategory]:
        factors: List[str] = []
        score = 0.08
        freq = profile.request_frequency_per_sec()
        pattern = profile.navigation_pattern()

        if freq > 10:
            score += 0.45
            factors.append(f"request_frequency={freq:.1f}/s")
        elif freq > 4:
            score += 0.22
            factors.append(f"elevated_frequency={freq:.1f}/s")

        if pattern == "BOT_LIKE_REPEAT":
            score += 0.40
            factors.append("repeated_search_without_select")
        elif pattern == "HUMAN_PROGRESSIVE":
            score = max(0.05, score - 0.15)
            factors.append("progressive_human_path")

        if profile.retries >= 6:
            score += 0.20
            factors.append(f"retry_storm={profile.retries}")
        elif profile.retries >= 3:
            score += 0.10
            factors.append(f"retries={profile.retries}")

        duration = profile.session_duration_seconds()
        if duration < 2.0 and len(profile.endpoints) >= 8:
            score += 0.25
            factors.append("burst_short_session")

        score = min(max(score, 0.0), 1.0)
        if score >= 0.8:
            category = ThreatCategory.AUTOMATED_BOT
        elif score >= 0.6:
            category = ThreatCategory.SUSPICIOUS_BEHAVIOR
        elif score >= 0.3:
            category = ThreatCategory.SUSPICIOUS_BEHAVIOR
        else:
            category = ThreatCategory.LEGITIMATE
        return score, factors, category

    def verdict_for(self, risk_score: float) -> Tuple[AccessControlVerdict, float]:
        """Adaptive response. Public-service rule: do not auto-block legitimate citizens."""
        if risk_score < 0.3:
            return AccessControlVerdict.ALLOW, 10.0
        if risk_score < 0.6:
            return AccessControlVerdict.ALLOW, 10.0  # monitor only
        if risk_score < 0.8:
            return AccessControlVerdict.CAPTCHA_CHALLENGE, 2.0
        return AccessControlVerdict.THROTTLE, 0.5

    def assess(self, profile: SessionProfile, ip_hash: str = "ip_hash_local") -> SecurityAssessment:
        risk, factors, category = self.score(profile)
        verdict, rps = self.verdict_for(risk)
        decision = ThreatDecision(
            verdict=verdict,
            threat_category=category,
            threat_score=round(risk, 4),
            throttle_rate_rps=rps,
            enforcement_layer="KAVACH_IN_MEMORY",
        )
        remaining = 60 if risk < 0.3 else (12 if risk < 0.8 else 2)
        return SecurityAssessment(
            session_id=profile.session_id,
            ip_hash=ip_hash,
            decision=decision,
            risk_factors=factors,
            request_fingerprint={
                "frequency_rps": round(profile.request_frequency_per_sec(), 3),
                "pattern": profile.navigation_pattern(),
                "retries": profile.retries,
                "endpoint_count": len(profile.endpoints),
            },
            rate_limit_remaining=remaining,
        )
