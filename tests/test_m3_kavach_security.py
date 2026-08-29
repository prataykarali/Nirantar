"""
NIRANTAR Module 3 / Kavach Security Test Suite
=============================================
Tests:
1. PII masking (mask_name, mask_phone, mask_card) & recursive payload sanitizer.
2. Session rate limiter under burst and high-frequency loads.
3. Session profiler navigation pattern detection (HUMAN_PROGRESSIVE vs BOT_LIKE_REPEAT).
4. Trust classifier threat scoring & adaptive verdict assignment.
5. Kavach Gateway end-to-end evaluation & audit logger.
6. Zero-PII safety boundary invariant (ensuring passwords/OTPs/CVVs never leak into context or logs).
7. FastAPI /api/v1/security/* endpoints.
"""

from fastapi.testclient import TestClient

from contracts.security import AccessControlVerdict, ThreatCategory
from security.privacy.masking import (
    mask_name,
    mask_phone,
    mask_card,
    sanitize_payload,
    recursive_payload_sanitizer,
)
from security.controls.rate_limiter import SessionRateLimiter
from security.detection.profiler import SessionProfiler
from security.detection.classifier import TrustClassifier
from security.gateway import KavachGateway
from security.audit.logger import AuditLogger
from backend.app.main import app

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. PII Masking & Recursive Payload Sanitizer
# -----------------------------------------------------------------------------
def test_pii_mask_name() -> None:
    assert mask_name("Asha Kumar").startswith("A***")
    assert mask_name("Ravi").startswith("R***")
    assert mask_name("") == "P****"
    assert mask_name("  ") == "P****"


def test_pii_mask_phone() -> None:
    assert mask_phone("9876543210") == "+91-******3210"
    assert mask_phone("+91-9988776655") == "+91-******6655"
    assert mask_phone("12") == "+91-********"
    assert mask_phone("") == "+91-********"


def test_pii_mask_card() -> None:
    assert mask_card("4111222233334444") == "****-****-****-4444"
    assert mask_card("5500 0000 1234 5678") == "****-****-****-5678"
    assert mask_card("123") == "****"
    assert mask_card("") == "****"


def test_recursive_payload_sanitizer() -> None:
    raw_payload = {
        "user_id": "usr_9988",
        "name": "Rajesh Sharma",
        "phone": "9811223344",
        "card_number": "4111111111111111",
        "credentials": {
            "password": "SuperSecretPassword123!",
            "otp": "987654",
            "cvv": "123",
            "pin": "4321",
        },
        "items": [
            {"passenger_name": "Anita Sharma", "mobile": "9822334455"},
            {"secret_key": "my_hidden_token"},
        ],
    }

    sanitized = sanitize_payload(raw_payload)
    assert sanitized["name"].startswith("R***")
    assert sanitized["phone"] == "+91-******3344"
    assert sanitized["card_number"] == "****-****-****-1111"
    assert sanitized["credentials"]["password"] == "[REDACTED]"
    assert sanitized["credentials"]["otp"] == "[REDACTED]"
    assert sanitized["credentials"]["cvv"] == "[REDACTED]"
    assert sanitized["credentials"]["pin"] == "[REDACTED]"

    items = sanitized["items"]
    assert items[0]["passenger_name"].startswith("A***")
    assert items[0]["mobile"] == "+91-******4455"

    aliased = recursive_payload_sanitizer(raw_payload)
    assert aliased == sanitized


# -----------------------------------------------------------------------------
# 2. Session Rate Limiter Under Burst and High-Frequency Loads
# -----------------------------------------------------------------------------
def test_session_rate_limiter_normal_flow() -> None:
    limiter = SessionRateLimiter()
    session_id = "ses_normal"

    allowed_count = 0
    for _ in range(5):
        allowed, _remaining = limiter.allow(session_id, max_rps=10.0)
        if allowed:
            allowed_count += 1

    assert allowed_count == 5


def test_session_rate_limiter_burst_and_exceeded() -> None:
    limiter = SessionRateLimiter()
    session_id = "ses_burst"

    max_rps = 5.0
    results = [limiter.allow(session_id, max_rps)[0] for _ in range(10)]

    assert results[:5] == [True, True, True, True, True]
    assert results[5:] == [False, False, False, False, False]


def test_session_rate_limiter_sub_one_rps() -> None:
    limiter = SessionRateLimiter()
    session_id = "ses_throttled"

    first_allowed, _ = limiter.allow(session_id, max_rps=0.5)
    second_allowed, _ = limiter.allow(session_id, max_rps=0.5)

    assert first_allowed is True
    assert second_allowed is False


# -----------------------------------------------------------------------------
# 3. Session Profiler Navigation Pattern Detection
# -----------------------------------------------------------------------------
def test_session_profiler_human_progressive_pattern() -> None:
    profiler = SessionProfiler()
    session_id = "ses_human_nav"

    for endpoint in ("HOME", "SEARCH", "RESULTS", "SELECT", "BOOK"):
        profiler.record(session_id, endpoint)

    profile = profiler.get_profile(session_id)
    assert profile.navigation_pattern() == "HUMAN_PROGRESSIVE"


def test_session_profiler_bot_like_repeat_pattern() -> None:
    profiler = SessionProfiler()
    session_id = "ses_bot_nav"

    for _ in range(6):
        profiler.record(session_id, "SEARCH")

    profile = profiler.get_profile(session_id)
    assert profile.navigation_pattern() == "BOT_LIKE_REPEAT"


def test_session_profiler_retries_tracking() -> None:
    profiler = SessionProfiler()
    session_id = "ses_retry"

    profiler.record(session_id, "SEARCH", is_retry=False)
    profiler.record(session_id, "SEARCH", is_retry=True)
    profiler.record(session_id, "SEARCH", is_retry=True)

    profile = profiler.get_profile(session_id)
    assert profile.retries == 2


# -----------------------------------------------------------------------------
# 4. Trust Classifier Threat Scoring & Adaptive Verdict Assignment
# -----------------------------------------------------------------------------
def test_trust_classifier_legitimate_human() -> None:
    clf = TrustClassifier()
    profiler = SessionProfiler()
    session_id = "ses_legit"

    for ep in ("HOME", "SEARCH", "RESULTS", "SELECT", "BOOK"):
        profiler.record(session_id, ep)

    profile = profiler.get_profile(session_id)
    score, factors, category = clf.score(profile)

    assert score < 0.3
    assert category == ThreatCategory.LEGITIMATE
    assert any("progressive_human_path" in f for f in factors)

    verdict, rps = clf.verdict_for(score)
    assert verdict == AccessControlVerdict.ALLOW
    assert rps == 10.0


def test_trust_classifier_high_risk_bot() -> None:
    clf = TrustClassifier()
    profiler = SessionProfiler()
    session_id = "ses_threat"

    for _ in range(12):
        profiler.record(session_id, "SEARCH", is_retry=True)

    profile = profiler.get_profile(session_id)
    score, _factors, category = clf.score(profile)

    assert score >= 0.6
    assert category in (ThreatCategory.SUSPICIOUS_BEHAVIOR, ThreatCategory.AUTOMATED_BOT)

    verdict, rps = clf.verdict_for(score)
    assert verdict in (AccessControlVerdict.CAPTCHA_CHALLENGE, AccessControlVerdict.THROTTLE)
    assert rps <= 2.0


def test_trust_classifier_never_autoblocks_moderate_risk() -> None:
    clf = TrustClassifier()
    verdict, rps = clf.verdict_for(0.45)
    assert verdict == AccessControlVerdict.ALLOW
    assert rps == 10.0


# -----------------------------------------------------------------------------
# 5. Kavach Gateway End-to-End Evaluation & Audit Logger
# -----------------------------------------------------------------------------
def test_kavach_gateway_evaluation_and_audit() -> None:
    gw = KavachGateway()
    session_id = "ses_e2e_gateway"

    assessment, allowed, reason = gw.evaluate(
        session_id=session_id,
        endpoint="/api/v1/booking/initiate",
        ip_hash="hash_abc123",
        is_retry=False,
    )

    assert assessment.session_id == session_id
    assert allowed is True
    assert reason in ("allow", "monitor", "challenge")

    dump = gw.dump(assessment, reason)
    assert "risk_score" in dump
    assert "verdict" in dump

    recent_logs = gw.audit.recent(limit=5, session_id=session_id)
    assert len(recent_logs) >= 1
    assert recent_logs[-1]["actor_id"] == session_id
    assert recent_logs[-1]["target_resource"] == "/api/v1/booking/initiate"


# -----------------------------------------------------------------------------
# 6. Zero-PII Safety Boundary Invariant
# -----------------------------------------------------------------------------
def test_zero_pii_safety_boundary_invariant() -> None:
    audit_logger = AuditLogger()
    session_id = "ses_pii_check"

    dirty_metadata = {
        "user_input": {
            "password": "MySuperSecretPassword!99",
            "otp": "654321",
            "cvv": "999",
            "card_number": "4111222233334444",
            "name": "Priya Sharma",
            "phone": "9876543210",
        }
    }

    audit_logger.record(
        session_id=session_id,
        resource="/api/v1/payment",
        verdict=AccessControlVerdict.ALLOW,
        metadata=dirty_metadata,
    )

    logs = audit_logger.recent(limit=1, session_id=session_id)
    recorded_meta = logs[0]["metadata"]

    as_str = str(recorded_meta)
    assert "MySuperSecretPassword!99" not in as_str
    assert "654321" not in as_str
    assert "999" not in as_str
    assert "4111222233334444" not in as_str
    assert "Priya Sharma" not in as_str
    assert "9876543210" not in as_str

    assert recorded_meta["user_input"]["password"] == "[REDACTED]"
    assert recorded_meta["user_input"]["otp"] == "[REDACTED]"
    assert recorded_meta["user_input"]["cvv"] == "[REDACTED]"
    assert recorded_meta["user_input"]["card_number"] == "****-****-****-4444"


# -----------------------------------------------------------------------------
# 7. FastAPI /api/v1/security/* Endpoints
# -----------------------------------------------------------------------------
def test_api_security_evaluate() -> None:
    resp = client.post(
        "/api/v1/security/evaluate",
        json={
            "session_id": "ses_api_test",
            "endpoint": "/api/v1/citizen/journey/step",
            "ip_hash": "ip_hash_test",
            "is_retry": False,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == 200
    assert "allowed" in data
    assert "reason" in data
    assert data["assessment"]["session_id"] == "ses_api_test"


def test_api_security_sanitize() -> None:
    payload = {
        "session_id": "ses_api_san",
        "password": "SecretPassword123",
        "phone": "9812345678",
        "card": "4111222233334444",
    }
    resp = client.post("/api/v1/security/sanitize", json={"payload": payload})
    assert resp.status_code == 200
    data = resp.json()
    sanitized = data["sanitized_payload"]
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["phone"] == "+91-******5678"
    assert sanitized["card"] == "****-****-****-4444"


def test_api_security_mask() -> None:
    resp = client.post(
        "/api/v1/security/mask",
        json={
            "name": "Vikram Singh",
            "phone": "9988776655",
            "card": "5500000011112222",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["masked_name"].startswith("V***")
    assert data["masked_phone"] == "+91-******6655"
    assert data["masked_card"] == "****-****-****-2222"


def test_api_security_audit_and_status() -> None:
    client.post(
        "/api/v1/security/evaluate",
        json={
            "session_id": "ses_audit_test",
            "endpoint": "/api/v1/search",
            "ip_hash": "ip_hash_audit",
            "is_retry": False,
        },
    )

    resp = client.get("/api/v1/security/audit?limit=10")
    assert resp.status_code == 200
    audit_data = resp.json()
    assert audit_data["status"] == 200
    assert audit_data["count"] >= 1
    assert isinstance(audit_data["events"], list)

    resp_status = client.get("/api/v1/security/status")
    assert resp_status.status_code == 200
    status_data = resp_status.json()
    assert status_data["status"] == 200
    assert status_data["zero_pii_enforced"] is True


def test_auth_pbkdf2_password_hashing_and_verification() -> None:
    from backend.app.api.auth import hash_password, verify_password

    raw_pw = "SecureP@ssword2026!"
    hashed = hash_password(raw_pw)
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False


def test_auth_no_backdoor_login() -> None:
    # Sign up a unique test user
    test_user = "user_sec_test_" + str(int(__import__("time").time()))
    signup_res = client.post("/api/v1/auth/signup", json={
        "display_name": "Security Tester",
        "username": test_user,
        "email": f"{test_user}@test.com",
        "password": "MySecretPassword123",
    })
    assert signup_res.status_code == 200

    # Attempt login with backdoor "nirantar2026" - MUST fail with 401
    bad_login = client.post("/api/v1/auth/login", json={
        "username_or_email": test_user,
        "password": "nirantar2026",
    })
    assert bad_login.status_code == 401

    # Attempt login with actual password - MUST succeed
    good_login = client.post("/api/v1/auth/login", json={
        "username_or_email": test_user,
        "password": "MySecretPassword123",
    })
    assert good_login.status_code == 200
    assert good_login.json()["isAuthenticated"] is True


def test_auth_session_unauthenticated_isolation() -> None:
    # Query session with no user_id -> must be UNAUTHENTICATED and NOT return first user
    sess = client.get("/api/v1/auth/session")
    assert sess.status_code == 200
    assert sess.json()["isAuthenticated"] is False
    assert sess.json()["userId"] is None

    # Query /me with no user_id -> must return 401
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 401


def test_digilocker_aadhaar_zero_pii_masking() -> None:
    digi_res = client.post("/api/v1/auth/oauth/digilocker", json={
        "aadhaar_number": "999988887777",
        "full_name": "Aadhaar Test Citizen",
        "phone": "9123456789",
    })
    assert digi_res.status_code == 200
    data = digi_res.json()
    assert data["isAuthenticated"] is True
    assert data["aadhaarVerified"] is True
    # Ensure masked version is present and raw 12 digits are masked
    assert data.get("maskedAadhaar") == "XXXX-XXXX-7777"

