"""
NIRANTAR — Search, Scrapling Scraper & Grounded Verification Endpoints
========================================================================
Exposes Apify Web Search, Scrapling Web Scraper, Grounded Fact Verification Core,
and Hybrid Grounded Context retrieval.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from backend.app.adapters.search.apify_adapter import ApifySearchEngine
from backend.app.adapters.search.scrapling_adapter import ScraplingWebScraper
from backend.app.adapters.search.grounding import GroundedFactVerifier, GroundingVerificationResult
from backend.app.adapters.search.vector_store import SnowflakeVectorStore

router = APIRouter(prefix="/api/v1/search", tags=["Real Web Search & Grounding Core"])

search_engine = ApifySearchEngine()
scrapling_scraper = ScraplingWebScraper()
fact_verifier = GroundedFactVerifier()
vector_store = SnowflakeVectorStore()


class WebSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=3, ge=1, le=10)


class ScraplingSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=3, ge=1, le=10)


class GroundVerificationRequest(BaseModel):
    llm_output: str = Field(..., description="LLM generated string output to verify for factual accuracy.")
    query: Optional[str] = Field(default=None, description="Original user query.")
    additional_facts: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional extra facts context.")


class HybridContextRequest(BaseModel):
    query: str = Field(..., description="User prompt query.")
    source_station: Optional[str] = Field(default=None, description="Optional source station code or name (e.g. NDLS).")
    destination_station: Optional[str] = Field(default=None, description="Optional destination station code or name (e.g. HWH).")
    top_k: int = Field(default=3, ge=1, le=10)
    use_scrapling: bool = Field(default=True, description="Whether to include live Scrapling web context.")


@router.post("/web")
def search_real_web(payload: WebSearchRequest = Body(...)) -> Dict[str, Any]:
    """Execute rate-limited, multi-tier cached real web search via Apify."""
    return search_engine.search_web(payload.query, max_results=payload.max_results)


@router.get("/cache/stats")
def get_search_cache_stats() -> Dict[str, Any]:
    """Retrieve cache hit statistics, cost savings, and rate limiting status."""
    return {
        "status": 200,
        "stats": search_engine.get_stats(),
    }


@router.post("/scrapling")
def search_scrapling_web(payload: ScraplingSearchRequest = Body(...)) -> Dict[str, Any]:
    """Execute Scrapling web scraping for government schemes and statutory guidelines with statutory fallback handling."""
    return scrapling_scraper.scrape_government_info(payload.query, max_results=payload.max_results)


@router.post("/ground-verification", response_model=GroundingVerificationResult)
def verify_llm_grounding(payload: GroundVerificationRequest = Body(...)) -> GroundingVerificationResult:
    """Cross-reference LLM output against local DB train inventory and Scrapling scraped facts to prevent hallucinated train numbers, seat availability, or fares."""
    return fact_verifier.verify_llm_output(
        llm_output=payload.llm_output,
        query=payload.query,
        additional_facts=payload.additional_facts,
    )


@router.post("/hybrid-context")
def get_hybrid_grounded_context(payload: HybridContextRequest = Body(...)) -> Dict[str, Any]:
    """Combine local DB train facts, vector similarity embeddings, and Scrapling live web scraper context into a unified grounded context payload."""
    return vector_store.get_unified_grounded_context(
        query=payload.query,
        source=payload.source_station,
        destination=payload.destination_station,
        top_k=payload.top_k,
        use_scrapling=payload.use_scrapling,
    )
