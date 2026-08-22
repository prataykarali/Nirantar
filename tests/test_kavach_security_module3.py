"""
Tests for NIRANTAR Module 3 (KAVACH Security, Fair Access Guard & Zero-PII Engine)
===================================================================================
Comprehensive testing for masking, payload sanitization, sliding-window rate limiting,
session profiling, trust scoring, public-service non-blocking rules, audit trails, and API endpoints.
"""

import time
import pytest
from fastapi.testclient import TestClient

from contracts.security import AccessControlVerdict, ThreatCategory
from security.privacy.masking import (
    mask_name,
    mask_phone,
    mask_card,
    mask_aadhaar,
    sanitize_payload,
)
from security.controls.rate_limiter import (
    SessionRateLimiter,
    RPS_HUMAN,
    RPS_CHALLENGE,
    RPS_HIGH_RISK,
)
from security.detection.profiler import SessionProfiler, SessionProfile
from security.detection.classifier import TrustClassifier
from security.gateway import KavachGateway
from backend.app.main import app


client = TestClient(app)


def test_pii_masking_functions() -> None:
    # Name masking
    assert mask_name("Asha Kumar") == "A*** K***"
    assert mask_name("Ramesh") == "R***"
    assert mask_name("") == "P****"

    # Phone masking
    assert mask_phone("9876543210") == "+91-******3210"
    assert mask_phone("123") == "+91-********"

    # Card masking
    assert mask_card("4532111122223333") == "****-****-****-3333"
    assert mask_card("123") == "****"

    # Aadhaar masking
    assert mask_aadhaar("123456789012") == "XXXX-XXXX-9012"
    assert mask_aadhaar("999") == "XXXX-XXXX-XXXX"


def test_sanitize_payload_recursive() -> None:
    raw_payload = {
        "user_id": "USR-101",
        "name": "Citizen One",
        "auth_token": "bearer_secret_token_123",
        "credentials": {
            "password": "mysecretpassword123",
            "otp": "456789",
            "pin": "1234",
            "cvv": "987",
        },
        "financial": {
            "card_number": "4111111111114444",
            "aadhaar": "987654321098",
        },
        "journey_data": ["SEARCH", "SELECT", "BOOK"],
    }

    sanitized = sanitize_payload(raw_payload)

    assert sanitized["user_id"] == "USR-101"
    assert sanitized["name"] == "C*** O***"
    assert sanitized["auth_token"] == "[REDACTED]"
    assert sanitized["credentials"]["password"] == "[REDACTED]"
    assert sanitized["credentials"]["otp"] == "[REDACTED]"
    assert sanitized["credentials"]["pin"] == "[REDACTED]"
    assert sanitized["credentials"]["cvv"] == "[REDACTED]"
    assert sanitized["financial"]["card_number"] == "****-****-****-4444"
    assert sanitized["financial"]["aadhaar"] == "XXXX-XXXX-1098"
    assert sanitized["journey_data"] == ["SEARCH", "SELECT", "BOOK"]


def test_sliding_window_rate_limiter_multi_tier() -> None:
    limiter = SessionRateLimiter()

    # 1. Human tier: 10.0 rps -> should allow up to 10 requests immediately
    for i in range(10):
        allowed, remaining = limiter.allow("ses-human-1", max_rps=RPS_HUMAN)
        assert allowed is True

    # 11th request in same second should be rate limited
    allowed, remaining = limiter.allow("ses-human-1", max_rps=RPS_HUMAN)
    assert allowed is False
    assert remaining == 0

    # 2. Challenge tier: 2.0 rps -> should allow up to 2 requests
    for i in range(2):
        allowed, _ = limiter.allow("ses-challenge-1", max_rps=RPS_CHALLENGE)
        assert allowed is True

    allowed, _ = limiter.allow("ses-challenge-1", max_rps=RPS_CHALLENGE)
    assert allowed is False

    # 3. High risk tier: 0.5 rps -> 1 request allowed per 2 seconds
    allowed, _ = limiter.allow("ses-bot-1", max_rps=RPS_HIGH_RISK)
    assert allowed is True

    allowed, _ = limiter.allow("ses-bot-1", max_rps=RPS_HIGH_RISK)
    assert allowed is False


def test_session_profiler_patterns() -> None:
    profiler = SessionProfiler()

    # Progressive human session
    for endpoint in ["HOME", "SEARCH", "RESULTS", "SELECT", "BOOK"]:
        profile = profiler.record("ses-p1", endpoint)
    assert profile.navigation_pattern() == "HUMAN_PROGRESSIVE"

    # Bot-like repeat search session
    for _ in range(6):
        profile = profiler.record("ses-b1", "SEARCH")
    assert profile.navigation_pattern() == "BOT_LIKE_REPEAT"


def test_trust_classifier_public_service_rule() -> None:
    classifier = TrustClassifier()

    # 1. Low risk (< 0.3) -> ALLOW, 10 rps
    verdict, rps = classifier.verdict_for(0.15)
    assert verdict == AccessControlVerdict.ALLOW
    assert rps == 10.0

    # 2. Moderate risk (0.3 - 0.6) -> ALLOW (Monitor, never blocked per public-service rule)
    verdict, rps = classifier.verdict_for(0.45)
    assert verdict == AccessControlVerdict.ALLOW
    assert rps == 10.0

    # 3. Elevated risk (0.6 - 0.8) -> CAPTCHA_CHALLENGE, 2.0 rps
    verdict, rps = classifier.verdict_for(0.72)
    assert verdict == AccessControlVerdict.CAPTCHA_CHALLENGE
    assert rps == 2.0

    # 4. High risk (>= 0.8) -> THROTTLE/BLOCK, 0.5 rps
    verdict, rps = classifier.verdict_for(0.85)
    assert verdict == AccessControlVerdict.THROTTLE
    assert rps == 0.5


def test_kavach_gateway_evaluate_and_audit() -> None:
    gw = KavachGateway()
    session_id = "ses-gw-test-1"

    assessment, allowed, reason = gw.evaluate(session_id, "/api/v1/booking/initiate")
    assert allowed is True
    assert reason in ("allow", "monitor")
    assert assessment.session_id == session_id

    # Verify audit trail
    recent_logs = gw.audit.recent(limit=10, session_id=session_id)
    assert len(recent_logs) >= 1
    assert recent_logs[0]["actor_id"] == session_id
    assert recent_logs[0]["target_resource"] == "/api/v1/booking/initiate"


def test_api_security_evaluate_endpoint() -> None:
    response = client.post(
        "/api/v1/security/evaluate",
        json={
            "session_id": "ses-api-test",
            "endpoint": "/api/v1/booking/initiate",
            "ip_hash": "ip_hash_abc",
            "is_retry": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert data["allowed"] is True
    assert "assessment" in data
    assert "kavach" in data
    assert data["kavach"]["verdict"] == "ALLOW"


def test_api_security_sanitize_endpoint() -> None:
    response = client.post(
        "/api/v1/security/sanitize",
        json={
            "payload": {
                "user": "Citizen Jane",
                "password": "supersecretpassword",
                "aadhaar": "999988887777",
                "card_number": "1111222233334444",
                "otp": "123456",
            }
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    sanitized = data["sanitized_payload"]
    assert sanitized["user"] == "Citizen Jane"
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["otp"] == "[REDACTED]"
    assert sanitized["aadhaar"] == "XXXX-XXXX-7777"
    assert sanitized["card_number"] == "****-****-****-4444"


def test_api_security_audit_logs_endpoint() -> None:
    # First record an evaluation to populate logs
    client.post(
        "/api/v1/security/evaluate",
        json={
            "session_id": "ses-audit-test",
            "endpoint": "/api/v1/search",
        },
    )

    response = client.get("/api/v1/security/audit-logs?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert data["count"] >= 1
    assert isinstance(data["logs"], list)

    # Test filtering by session_id
    filtered_res = client.get("/api/v1/security/audit-logs?limit=20&session_id=ses-audit-test")
    assert filtered_res.status_code == 200
    filtered_data = filtered_res.json()
    assert filtered_data["count"] >= 1
    assert all(log["actor_id"] == "ses-audit-test" for log in filtered_data["logs"])
