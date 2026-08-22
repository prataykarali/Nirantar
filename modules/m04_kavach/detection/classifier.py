"""
KAVACH — Adaptive trust classifier.
Scores sessions (0.0 to 1.0) and enforces the public-service rule:
Never auto-block legitimate citizens below risk threshold 0.8.
"""

from __future__ import annotations

from typing import List, Tuple, Optional

from contracts.security import (
    AccessControlVerdict,
    SecurityAssessment,
    ThreatCategory,
    ThreatDecision,
)
from security.detection.profiler import SessionProfile


class TrustClassifier:
    """Map session behaviour → threat risk_score (0.0 - 1.0) → adaptive decision verdict."""

    def _eval_freq(self, freq: float) -> Tuple[float, Optional[str]]:
        if freq > 10.0:
            return 0.45, f"request_frequency={freq:.1f}/s"
        if freq > 4.0:
            return 0.22, f"elevated_frequency={freq:.1f}/s"
        return 0.0, None

    def _eval_pattern(self, pattern: str) -> Tuple[float, Optional[str]]:
        if pattern == "BOT_LIKE_REPEAT":
            return 0.40, "repeated_search_without_select"
        if pattern == "HUMAN_PROGRESSIVE":
            return -0.15, "progressive_human_path"
        return 0.0, None

    def _eval_retries(self, retries: int) -> Tuple[float, Optional[str]]:
        if retries >= 6:
            return 0.20, f"retry_storm={retries}"
        if retries >= 3:
            return 0.10, f"retries={retries}"
        return 0.0, None

    def _eval_category(self, score: float) -> ThreatCategory:
        if score >= 0.8:
            return ThreatCategory.AUTOMATED_BOT
        if score >= 0.3:
            return ThreatCategory.SUSPICIOUS_BEHAVIOR
        return ThreatCategory.LEGITIMATE

    def score(self, profile: SessionProfile) -> Tuple[float, List[str], ThreatCategory]:
        factors: List[str] = []
        score = 0.08

        freq_score, freq_factor = self._eval_freq(profile.request_frequency_per_sec())
        score += freq_score
        if freq_factor:
            factors.append(freq_factor)

        pat = profile.navigation_pattern()
        pat_score, pat_factor = self._eval_pattern(pat)
        score = max(0.05, score + pat_score) if pat == "HUMAN_PROGRESSIVE" else score + pat_score
        if pat_factor:
            factors.append(pat_factor)

        ret_score, ret_factor = self._eval_retries(profile.retries)
        score += ret_score
        if ret_factor:
            factors.append(ret_factor)

        if profile.session_duration_seconds() < 2.0 and len(profile.endpoints) >= 8:
            score += 0.25
            factors.append("burst_short_session")

        score = min(max(score, 0.0), 1.0)
        return score, factors, self._eval_category(score)

    def verdict_for(self, risk_score: float) -> Tuple[AccessControlVerdict, float]:
        """
        Adaptive response enforcing the Public-Service Rule:
        Never auto-block legitimate citizens below risk threshold 0.8.
        """
        if risk_score < 0.3:
            return AccessControlVerdict.ALLOW, 10.0
        if risk_score < 0.6:
            return AccessControlVerdict.ALLOW, 10.0
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
