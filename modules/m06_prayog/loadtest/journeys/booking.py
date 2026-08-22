"""Sequential BOOK_TRAIN journey helpers for Locust virtual users."""

from __future__ import annotations

from typing import Any, Dict

from loadtest.journeys.search import CitizenJourneys

OPEN = "/health"
SEARCH = "/api/v1/trains/search"
AVAIL = "/api/v1/availability"
INTENT = "/api/v1/citizen/intent"
BOOK = "/api/v1/booking/initiate"


def search_url() -> str:
    payload = CitizenJourneys.random_search_payload()
    return f"{SEARCH}?source={payload['source']}&destination={payload['destination']}"


def intent_body(language: str = "hi") -> Dict[str, Any]:
    route = CitizenJourneys.random_search_payload()
    return {
        "query": f"book train from {route['source']} to {route['destination']}",
        "language": language,
    }
