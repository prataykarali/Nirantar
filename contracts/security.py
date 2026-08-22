"""
NIRANTAR Contracts — Security, Trust & Threat Assessment Schemas
================================================================
Owned by Agent 5 (SENTINEL / Kavach), integrated with Agent 3 (FORGE / Orchestrator).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class ThreatCategory(str, Enum):
    LEGITIMATE = "LEGITIMATE"
    SUSPICIOUS_BEHAVIOR = "SUSPICIOUS_BEHAVIOR"
    AUTOMATED_BOT = "AUTOMATED_BOT"
    SCRAPER = "SCRAPER"
    DISTRIBUTED_ATTACK = "DISTRIBUTED_ATTACK"


class AccessControlVerdict(str, Enum):
    ALLOW = "ALLOW"
    THROTTLE = "THROTTLE"
    CAPTCHA_CHALLENGE = "CAPTCHA_CHALLENGE"
    QUEUE_ISOLATE = "QUEUE_ISOLATE"
    BLOCK = "BLOCK"


class ThreatDecision(BaseModel):
    """Actionable decision output from the security classification engine."""
    decision_id: str = Field(default_factory=lambda: f"DEC-{uuid.uuid4().hex[:8].upper()}")
    verdict: AccessControlVerdict = AccessControlVerdict.ALLOW
    threat_category: ThreatCategory = ThreatCategory.LEGITIMATE
    threat_score: float = Field(default=0.0, ge=0.0, le=1.0)
    throttle_rate_rps: Optional[float] = None
    ttl_seconds: int = 300
    enforcement_layer: str = "GATEWAY_REDIS"


class SecurityAssessment(BaseModel):
    """Comprehensive security evaluation for an incoming session/request."""
    assessment_id: str = Field(default_factory=lambda: f"SEC-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    session_id: str
    ip_hash: str
    decision: ThreatDecision
    risk_factors: List[str] = Field(default_factory=list)
    request_fingerprint: Dict[str, Any] = Field(default_factory=dict)
    rate_limit_remaining: int = 60


class SecurityAuditLog(BaseModel):
    """Immutable audit trail event."""
    audit_id: str = Field(default_factory=lambda: f"AUD-{uuid.uuid4().hex[:8].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: str = "ACCESS_EVALUATION"
    actor_id: str = "ANON"
    target_resource: str = "/api/v1/booking/initiate"
    verdict: AccessControlVerdict = AccessControlVerdict.ALLOW
    metadata: Dict[str, Any] = Field(default_factory=dict)
