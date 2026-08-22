"""
NIRANTAR Module 5 / Grounded Search Core Test Suite
====================================================
Tests:
1. Scrapling Web Scraper live text extraction & statutory fallback handling.
2. GroundedFactVerifier detecting grounded facts vs ungrounded LLM claims.
3. Hybrid context assembler (DB + Vector RAG + Scrapling).
4. FastAPI /api/v1/search/* endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.adapters.search.scrapling_adapter import (
    ScraplingWebScraper,
    search_web_scrapling,
)
from backend.app.adapters.search.grounding import (
    GroundedFactVerifier,
    GroundingVerificationResult,
)
from backend.app.adapters.search.vector_store import SnowflakeVectorStore

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Scrapling Web Scraper Live Text Extraction & Statutory Fallback Handling
# -----------------------------------------------------------------------------

def test_scrapling_scraper_statutory_fallback() -> None:
    """Verify Scrapling scraper returns structured statutory fallback for civic queries."""
    scraper = ScraplingWebScraper()
    res = scraper.scrape_government_info("aadhaar biometric update SLA", max_results=2)

    assert res["status"] == 200
    assert res["source"] in [
        "SCRAPLING_LIVE_WEB_SCRAPER",
        "SCRAPLING_SCRAPER",
        "SCRAPLING_SCRAPER_STATUTORY_FALLBACK",
    ]
    assert len(res["results"]) > 0
    assert "snippet" in res["results"][0]
    assert "url" in res["results"][0]
    assert "title" in res["results"][0]
    assert "source" in res["results"][0]


def test_scrapling_scraper_live_text_extraction() -> None:
    """Verify Scrapling scraper text extraction logic and max_results constraint."""
    scraper = ScraplingWebScraper()
    res = scraper.scrape_government_info("driving license renewal", max_results=3)

    assert res["status"] == 200
    assert len(res["results"]) <= 3
    for item in res["results"]:
        assert len(item["snippet"]) > 0
        assert isinstance(item["title"], str)


def test_search_web_scrapling_helper() -> None:
    """Verify search_web_scrapling helper function entrypoint."""
    res = search_web_scrapling("irctc tatkal booking rules", max_results=1)
    assert res["status"] == 200
    assert len(res["results"]) == 1


# -----------------------------------------------------------------------------
# 2. GroundedFactVerifier - Grounded vs Ungrounded LLM Claims Detection
# -----------------------------------------------------------------------------

def test_grounded_verifier_claim_extraction() -> None:
    """Verify GroundedFactVerifier extracts train numbers, fares, and availabilities."""
    verifier = GroundedFactVerifier()
    text = "Train 12951 costs ₹3150 with AVAILABLE-45 seats. Also Train 12301 WL-12."
    claims = verifier.extract_claims(text)

    assert "12951" in claims["train_numbers"]
    assert "12301" in claims["train_numbers"]
    assert 3150.0 in claims["fares"]
    assert 45 in claims["availabilities"] or 12 in claims["availabilities"]


def test_grounded_verifier_valid_train_inventory() -> None:
    """Verify valid train 12951 passes grounding verification against local DB inventory."""
    verifier = GroundedFactVerifier()
    llm_output = "Train 12951 MUMBAI RAJDHANI operates from NDLS to BCT with AVAILABLE-45 seats."

    result = verifier.verify_llm_output(llm_output=llm_output, query="NDLS to BCT train availability")

    assert isinstance(result, GroundingVerificationResult)
    assert result.is_grounded is True
    assert result.verification_score >= 0.70
    assert len(result.ungrounded_claims) == 0
    assert len(result.verified_facts) > 0


def test_grounded_verifier_hallucinated_train_detection() -> None:
    """Verify hallucinated train number 99999 and fake fare ₹99999 are detected and flagged."""
    verifier = GroundedFactVerifier()
    llm_output = "You can take Train 99999 SUPERFAST EXPRESS with fare ₹99999 for instant booking."

    result = verifier.verify_llm_output(llm_output=llm_output, query="fake train search")

    assert isinstance(result, GroundingVerificationResult)
    assert result.is_grounded is False
    assert len(result.ungrounded_claims) > 0
    assert any("99999" in claim for claim in result.ungrounded_claims)


def test_grounded_verifier_external_facts_fallback() -> None:
    """Verify ungrounded claim can be validated if supported by external search facts."""
    verifier = GroundedFactVerifier()
    llm_output = "Train 55555 SPECIAL EXPRESS operates daily."
    external_facts = [{"info": "Train 55555 SPECIAL EXPRESS runs between station A and B."}]

    result = verifier.verify_llm_output(
        llm_output=llm_output,
        query="special train info",
        additional_facts=external_facts,
    )

    assert result.is_grounded is True
    assert any("55555" in fact for fact in result.verified_facts)


# -----------------------------------------------------------------------------
# 3. Hybrid Context Assembler (DB + Vector RAG + Scrapling)
# -----------------------------------------------------------------------------

def test_hybrid_context_assembler_full() -> None:
    """Verify hybrid context assembler combines DB inventory, vector search, and Scrapling web facts."""
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
    assert "scrapling_live_web_context" in context
    assert "grounded_context_str" in context
    assert "=== LOCAL DB TRAIN INVENTORY FACTS ===" in context["grounded_context_str"]


def test_hybrid_context_assembler_without_scrapling() -> None:
    """Verify hybrid context assembler when use_scrapling is set to False."""
    store = SnowflakeVectorStore()
    context = store.get_unified_grounded_context(
        query="NDLS to BCT route guide",
        source="NDLS",
        destination="BCT",
        top_k=2,
        use_scrapling=False,
    )

    assert context["status"] == 200
    assert context["scrapling_live_web_context"] == []
    assert len(context["local_db_train_facts"]) > 0


# -----------------------------------------------------------------------------
# 4. FastAPI /api/v1/search/* Endpoints Integration Tests
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
    assert len(data["results"]) <= 2


def test_api_ground_verification_endpoint_valid() -> None:
    """Test POST /api/v1/search/ground-verification with valid grounded input."""
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
    assert data["is_grounded"] is True


def test_api_ground_verification_endpoint_hallucinated() -> None:
    """Test POST /api/v1/search/ground-verification with hallucinated output."""
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


def test_api_web_search_and_cache_stats_endpoints() -> None:
    """Test POST /api/v1/search/web and GET /api/v1/search/cache/stats."""
    web_res = client.post(
        "/api/v1/search/web",
        json={"query": "test query", "max_results": 2},
    )
    assert web_res.status_code == 200

    stats_res = client.get("/api/v1/search/cache/stats")
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["status"] == 200
    assert "stats" in data
