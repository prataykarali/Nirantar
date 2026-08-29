"""
NIRANTAR — Security, Rate Limiting & Digital Banking Tests
============================================================
Tests verifying defensive security headers, multi-user sliding-window rate limiting,
and digital bank wallet top-up / real-time balance debit integrity.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.rate_limiter import SlidingWindowRateLimiter, RateLimitMiddleware


client = TestClient(app)


def test_security_headers_present_on_endpoints():
    """Verify that OWASP-compliant defensive security headers are injected into API responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "max-age=" in resp.headers.get("Strict-Transport-Security", "")


def test_sliding_window_rate_limiter_unit_logic():
    """Verify rate limiter allows requests within threshold and blocks with 429 when burst limit is hit."""
    limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=10)
    client_id = "test_citizen_ip_1"

    # First 5 requests should pass
    for i in range(5):
        allowed, remaining, retry_after = limiter.is_allowed(client_id)
        assert allowed is True
        assert remaining == 5 - (i + 1)
        assert retry_after == 0

    # 6th request within window must be rejected
    allowed, remaining, retry_after = limiter.is_allowed(client_id)
    assert allowed is False
    assert remaining == 0
    assert retry_after > 0


def test_rate_limit_headers_on_api_response():
    """Verify rate limit tracking headers exist on non-exempt API endpoints."""
    resp = client.get("/api/v1/stations")
    assert resp.status_code == 200
    assert "X-RateLimit-Limit" in resp.headers
    assert "X-RateLimit-Remaining" in resp.headers


def test_wallet_balance_and_topup_flow():
    """Verify digital bank wallet balance fetch, fund top-up, and real-time debit."""
    user_id = "usr-test-wallet-999"

    # 1. Initial balance check
    bal_resp = client.get(f"/api/v1/payments/wallet/balance?user_id={user_id}")
    assert bal_resp.status_code == 200
    bal_data = bal_resp.json()
    assert bal_data["currency"] == "INR"
    assert bal_data["balance"] == 10000.0

    # 2. Top-up / Fund addition
    topup_resp = client.post(
        "/api/v1/payments/wallet/topup",
        json={"user_id": user_id, "amount": 2500, "source": "UPI"},
    )
    assert topup_resp.status_code == 200
    topup_data = topup_resp.json()
    assert topup_data["success"] is True
    assert topup_data["amountAdded"] == 2500
    assert topup_data["newBalance"] == 12500.0
    assert "credited to Digital Citizen Travel Bank" in topup_data["smsAlert"]

    # 3. Debit / Ticket Fare deduction
    debit_resp = client.post(
        f"/api/v1/payments/wallet/debit?user_id={user_id}&amount=3150&purpose=Rajdhani+Express+Ticket"
    )
    assert debit_resp.status_code == 200
    debit_data = debit_resp.json()
    assert debit_data["success"] is True
    assert debit_data["amountDebited"] == 3150
    assert debit_data["newBalance"] == 9350.0
    assert "debited from A/C XX8492" in debit_data["smsAlert"]


def test_wallet_topup_validation_bounds():
    """Verify negative amounts and excessive single transactions are blocked."""
    resp_neg = client.post(
        "/api/v1/payments/wallet/topup",
        json={"user_id": "usr-test-bounds", "amount": -500, "source": "UPI"},
    )
    assert resp_neg.status_code == 400

    resp_excess = client.post(
        "/api/v1/payments/wallet/topup",
        json={"user_id": "usr-test-bounds", "amount": 60000, "source": "NET_BANKING"},
    )
    assert resp_excess.status_code == 400
