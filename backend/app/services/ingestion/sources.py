"""
Permitted public railway information sources.

Scrapling obtains only public, non-personal pages.
This module is the swap-point for an official documented API later.

Never scrape:
  - personal information
  - login/booking/payment systems
  - undocumented private APIs
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Protocol

PERMITTED_PUBLIC_SOURCES: List[Dict[str, str]] = [
    {
        "id": "india_gov_railways",
        "url": "https://www.india.gov.in/topics/travel-tourism/railways",
        "title": "National Portal of India — Railways",
        "kind": "public_notice",
    },
    {
        "id": "indian_railways_home",
        "url": "https://indianrailways.gov.in/",
        "title": "Indian Railways — Public Information",
        "kind": "passenger_charter",
    },
]

ALLOWED_URLS = {item["url"] for item in PERMITTED_PUBLIC_SOURCES}

SEED_PUBLIC_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "source_id": "seed_passenger_charter",
        "url": "https://indianrailways.gov.in/",
        "title": "Indian Railways Passenger Charter (public summary)",
        "text": (
            "Public passenger information: enquiry channels, passenger amenities, "
            "and published refund windows are described on official Indian Railways websites. "
            "This prototype does not access booking accounts or personal PNR records."
        ),
        "kind": "passenger_charter",
        "is_live": False,
    },
    {
        "source_id": "seed_public_enquiry",
        "url": "https://www.india.gov.in/topics/travel-tourism/railways",
        "title": "National Portal — public railway services",
        "text": (
            "The National Portal of India lists publicly described railway citizen services "
            "including enquiry guidance and travel-tourism information. "
            "Inventory, fares, and seats in Nirantar come from the local prototype dataset."
        ),
        "kind": "public_notice",
        "is_live": False,
    },
]


@dataclass
class RawDocument:
    source_id: str
    url: str
    title: str
    text: str
    kind: str
    is_live: bool = False
    extra: Dict[str, Any] = field(default_factory=dict)


class RailwayInfoSource(Protocol):
    """Replaceable source. Official API adapters must implement obtain()."""

    name: str

    def obtain(self, query: str) -> List[RawDocument]:
        ...


class ScraplingPublicSource:
    """Fetch allowlisted public pages with Scrapling. No private systems."""

    name = "scrapling"

    def obtain(self, query: str) -> List[RawDocument]:
        from scrapling import Fetcher

        fetcher = Fetcher()
        documents: List[RawDocument] = []
        for source in PERMITTED_PUBLIC_SOURCES:
            url = source["url"]
            if url not in ALLOWED_URLS:
                continue
            try:
                page = fetcher.get(url, timeout=8)
                status = getattr(page, "status", 0)
                if status != 200:
                    continue
                titles = page.css("title::text, h1::text").getall() if hasattr(page, "css") else []
                paragraphs = page.css("p::text").getall() if hasattr(page, "css") else []
                title_text = " - ".join(t.strip() for t in titles if isinstance(t, str) and t.strip())
                body = " ".join(p.strip() for p in paragraphs if isinstance(p, str) and len(p.strip()) > 40)
                if not body:
                    continue
                documents.append(
                    RawDocument(
                        source_id=source["id"],
                        url=url,
                        title=title_text or source["title"],
                        text=body[:4000],
                        kind=source["kind"],
                        is_live=True,
                    )
                )
            except Exception:
                continue
        return documents


class OfficialRailwayAPISource:
    """
    Drop-in replacement when an official documented API is authorized.

    Configure RAILWAY_OFFICIAL_API_URL. Until then this source is inert
    and the pipeline falls back to Scrapling / seed public notices.
    """

    name = "official_api"

    def obtain(self, query: str) -> List[RawDocument]:
        api_url = os.getenv("RAILWAY_OFFICIAL_API_URL", "").strip()
        if not api_url:
            return []
        import httpx

        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.get(api_url, params={"q": query})
            if resp.status_code != 200:
                return []
            payload = resp.json()
            records = payload if isinstance(payload, list) else payload.get("records", [])
            documents: List[RawDocument] = []
            for item in records:
                url = str(item.get("url") or api_url)
                if ALLOWED_URLS and not url.startswith(tuple(ALLOWED_URLS)) and url != api_url:
                    continue
                documents.append(
                    RawDocument(
                        source_id=str(item.get("id") or "official"),
                        url=url,
                        title=str(item.get("title") or "Official railway information"),
                        text=str(item.get("text") or item.get("summary") or ""),
                        kind=str(item.get("kind") or "public_notice"),
                        is_live=True,
                    )
                )
            return documents
        except Exception:
            return []


class SeedPublicSource:
    name = "seed"

    def obtain(self, query: str) -> List[RawDocument]:
        q = (query or "").lower()
        docs = []
        for item in SEED_PUBLIC_DOCUMENTS:
            blob = f"{item['title']} {item['text']}".lower()
            if not q or any(token in blob for token in q.split()[:6]):
                docs.append(
                    RawDocument(
                        source_id=item["source_id"],
                        url=item["url"],
                        title=item["title"],
                        text=item["text"],
                        kind=item["kind"],
                        is_live=False,
                    )
                )
        return docs or [
            RawDocument(
                source_id=SEED_PUBLIC_DOCUMENTS[0]["source_id"],
                url=SEED_PUBLIC_DOCUMENTS[0]["url"],
                title=SEED_PUBLIC_DOCUMENTS[0]["title"],
                text=SEED_PUBLIC_DOCUMENTS[0]["text"],
                kind=SEED_PUBLIC_DOCUMENTS[0]["kind"],
                is_live=False,
            )
        ]


def get_railway_source() -> RailwayInfoSource:
    mode = os.getenv("RAILWAY_INFO_SOURCE", "scrapling").strip().lower()
    if mode == "official_api":
        return OfficialRailwayAPISource()
    return ScraplingPublicSource()
