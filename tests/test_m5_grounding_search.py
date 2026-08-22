"""
NIRANTAR Module 5 / Grounding & Search Core Test Suite
======================================================
Tests:
1. Scrapling Web Scraper & .getall() extraction with statutory fallbacks.
2. Grounded Fact Verifier (verifying train numbers, seat availability, fares against local DB inventory).
3. Grounded Fact Verifier detection of hallucinated train numbers & fares.
4. Unified Hybrid Grounded Context Payload Generation (DB facts + vector store + Scrapling web facts).
5. FastAPI Endpoints: /api/v1/search/scrapling, /api/v1/search/ground-verification, /api/v1/search/hybrid-context.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.adapters.search.scrapling_adapter import ScraplingWebScraper, search_web_scrapling
from backend.app.adapters.search.grounding import GroundedFactVerifier, GroundingVerificationResult
from backend.app.adapters.search.vector_store import SnowflakeVectorStore

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Scrapling Web Scraper Tests
# -----------------------------------------------------------------------------
def test_scrapling_scraper_statutory_fallback() -> None:
    """Verify Scrapling scraper returns structured statutory fallback for civic queries."""
    scraper = ScraplingWebScraper()
    res = scraper.scrape_government_info("aadhaar biometric update SLA", max_results=2)

    assert res["status"] == 200
    assert res["source"] in ["SCRAPLING_LIVE_WEB_SCRAPER", "SCRAPLING_SCRAPER_STATUTORY_FALLBACK"]
    assert len(res["results"]) > 0
    assert "snippet" in res["results"][0]
    assert "url" in res["results"][0]


def test_search_web_scrapling_helper() -> None:
    """Verify helper function search_web_scrapling entrypoint."""
    res = search_web_scrapling("irctc tatkal booking rules", max_results=1)
    assert res["status"] == 200
    assert len(res["results"]) >= 1


# -----------------------------------------------------------------------------
# 2. Grounded Fact Verifier Tests
# -----------------------------------------------------------------------------
def test_grounded_verifier_valid_train() -> None:
    """Verify valid train number 12951 (MUMBAI RAJDHANI) passes grounding verification."""
    verifier = GroundedFactVerifier()
    llm_output = "Train 12951 MUMBAI RAJDHANI operates from NDLS to BCT with AVAILABLE-45 seats."
    
    result = verifier.verify_llm_output(llm_output=llm_output, query="NDLS to BCT train availability")

    assert isinstance(result, GroundingVerificationResult)
    assert result.is_grounded is True
    assert result.verification_score >= 0.70
    assert len(result.ungrounded_claims) == 0
    assert len(result.verified_facts) > 0


def test_grounded_verifier_hallucinated_train() -> None:
    """Verify fake train number 99999 is flagged as hallucinated claim."""
    verifier = GroundedFactVerifier()
    llm_output = "You can take Train 99999 SUPERFAST EXPRESS with fare ₹99999 for instant booking."

    result = verifier.verify_llm_output(llm_output=llm_output, query="fake train search")

    assert isinstance(result, GroundingVerificationResult)
    assert result.is_grounded is False
    assert len(result.ungrounded_claims) > 0
    assert any("99999" in claim for claim in result.ungrounded_claims)


# -----------------------------------------------------------------------------
# 3. Unified Grounded Context Store Tests
# -----------------------------------------------------------------------------
def test_unified_grounded_context() -> None:
    """Verify SnowflakeVectorStore generates unified grounded context combining local DB + Scrapling context."""
    store = SnowflakeVectorStore()
    context = store.get_unified_grounded_context(
        query="Trains from NDLS to HWH",
        source="NDLS",
        destination="HWH",
        top_k=2,
        use_scrapling=True,
    )

    assert context["status"] == 200
    assert "local_db_train_facts" in context
    assert len(context["local_db_train_facts"]) > 0
    assert "grounded_context_str" in context
    assert "=== LOCAL DB TRAIN INVENTORY FACTS ===" in context["grounded_context_str"]


# -----------------------------------------------------------------------------
# 4. FastAPI Endpoints Integration Tests
# -----------------------------------------------------------------------------
def test_api_scrapling_endpoint() -> None:
    """Test POST /api/v1/search/scrapling."""
    response = client.post(
        "/api/v1/search/scrapling",
        json={"query": "driving license renewal rules", "max_results": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert "results" in data


def test_api_ground_verification_endpoint_valid() -> None:
    """Test POST /api/v1/search/ground-verification with valid input."""
    response = client.post(
        "/api/v1/search/ground-verification",
        json={
            "llm_output": "Train 12301 HOWRAH RAJDHANI runs daily from HWH to NDLS.",
            "query": "HWH to NDLS train schedule",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "is_grounded" in data
    assert "verification_score" in data
    assert "verified_facts" in data
    assert "ungrounded_claims" in data


def test_api_ground_verification_endpoint_hallucinated() -> None:
    """Test POST /api/v1/search/ground-verification with hallucinated train."""
    response = client.post(
        "/api/v1/search/ground-verification",
        json={
            "llm_output": "Train 88888 PHANTOM EXPRESS costs ₹85000.",
            "query": "phantom train schedule",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_grounded"] is False
    assert len(data["ungrounded_claims"]) > 0


def test_api_hybrid_context_endpoint() -> None:
    """Test POST /api/v1/search/hybrid-context."""
    response = client.post(
        "/api/v1/search/hybrid-context",
        json={
            "query": "Show trains from NDLS to BCT",
            "source_station": "NDLS",
            "destination_station": "BCT",
            "top_k": 2,
            "use_scrapling": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert "local_db_train_facts" in data
    assert "grounded_context_str" in data
