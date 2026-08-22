"""
NIRANTAR Module 3 — Security API Endpoints (KAVACH Security Engine)
===================================================================
Endpoints for security evaluation, PII payload sanitization, masking, audit logs, and status.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, Query
from pydantic import BaseModel, Field

from security.gateway import KavachGateway
from security.privacy.masking import mask_name, mask_phone, mask_card, mask_aadhaar

router = APIRouter(prefix="/api/v1/security", tags=["Security & Kavach"])

# Central Kavach Gateway instance
kavach = KavachGateway()


class EvaluateRequest(BaseModel):
    session_id: str = Field(..., description="Unique synthetic session ID")
    endpoint: str = Field(default="/api/v1/booking/initiate", description="Target resource endpoint")
    ip_hash: str = Field(default="ip_hash_local", description="Anonymized IP hash")
    is_retry: bool = Field(default=False, description="Flag indicating if request is a retry")


class SanitizeRequest(BaseModel):
    payload: Dict[str, Any] = Field(..., description="Payload dictionary to scrub of PII fields")


class MaskRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    card: Optional[str] = None
    aadhaar: Optional[str] = None


@router.post("/evaluate")
def evaluate_security_session(payload: EvaluateRequest = Body(...)) -> Dict[str, Any]:
    """
    Evaluate incoming request session risk, threat category, and rate limits.
    Enforces fair access rules and returns actionable threat decisions.
    """
    assessment, allowed, reason = kavach.evaluate(
        session_id=payload.session_id,
        endpoint=payload.endpoint,
        ip_hash=payload.ip_hash,
        is_retry=payload.is_retry,
    )
    return {
        "status": 200,
        "allowed": allowed,
        "reason": reason,
        "assessment": assessment.model_dump(),
        "kavach": kavach.dump(assessment, reason),
    }


@router.post("/sanitize")
def sanitize_sensitive_payload(payload: SanitizeRequest = Body(...)) -> Dict[str, Any]:
    """
    Recursively sanitize input JSON payload, masking or redacting sensitive fields.
    Zero-PII guarantee for all logs and persistence layers.
    """
    sanitized = kavach.sanitize(payload.payload)
    return {
        "status": 200,
        "sanitized_payload": sanitized,
    }


@router.post("/mask")
def mask_pii_fields(payload: MaskRequest = Body(...)) -> Dict[str, Any]:
    """
    Explicit PII masking endpoint for individual fields.
    """
    return {
        "status": 200,
        "masked_name": mask_name(payload.name or ""),
        "masked_phone": mask_phone(payload.phone or ""),
        "masked_card": mask_card(payload.card or ""),
        "masked_aadhaar": mask_aadhaar(payload.aadhaar or ""),
    }


@router.get("/audit")
@router.get("/audit-logs")
def get_security_audit_logs(
    limit: int = Query(default=50, ge=1, le=500),
    session_id: Optional[str] = Query(default=None, description="Optional session filter"),
) -> Dict[str, Any]:
    """
    Retrieve immutable audit trail events recorded by Kavach Gateway.
    """
    logs = kavach.audit.recent(limit=limit, session_id=session_id)
    return {
        "status": 200,
        "count": len(logs),
        "events": logs,
        "logs": logs,
    }


@router.get("/status")
def get_security_status() -> Dict[str, Any]:
    """
    Retrieve security status and configuration metadata.
    """
    return {
        "status": 200,
        "service": "Kavach Security Gateway",
        "zero_pii_enforced": True,
        "rate_limiter_active": True,
        "trust_classifier_active": True,
    }
