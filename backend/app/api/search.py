"""
NIRANTAR — Real Web Search Endpoints (Apify + Cache + Rate Limiting)
====================================================================
"""

from typing import Any, Dict
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field
from backend.app.adapters.search.apify_adapter import ApifySearchEngine

router = APIRouter(prefix="/api/v1/search", tags=["Real Web Search"])

search_engine = ApifySearchEngine()


class WebSearchRequest(BaseModel):
    query: str
    max_results: int = Field(default=3, ge=1, le=10)


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
