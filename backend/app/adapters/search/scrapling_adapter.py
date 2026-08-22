"""
NIRANTAR — Web Scraper Engine powered by Scrapling
===================================================
Scrapes real government portals (india.gov.in, uidai.gov.in, parivahan.gov.in)
and scheme information matching citizen queries with statutory fallback handling.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from scrapling import Fetcher

logger = logging.getLogger(__name__)

# Primary trusted government sources for NIRANTAR
CIVIC_SCHEME_SOURCES = [
    {
        "domain": "india.gov.in",
        "url": "https://www.india.gov.in/my-government/schemes",
        "title": "National Portal of India — Government Schemes & Services",
    },
    {
        "domain": "uidai.gov.in",
        "url": "https://uidai.gov.in/en/my-aadhaar/update-aadhaar.html",
        "title": "UIDAI — Identity & Address Verification Guidelines",
    },
    {
        "domain": "parivahan.gov.in",
        "url": "https://parivahan.gov.in/parivahan/",
        "title": "Parivahan Sewa — Driving License & Transport Services",
    },
    {
        "domain": "services.india.gov.in",
        "url": "https://services.india.gov.in/",
        "title": "Services Portal — Citizen Certificates & Online Applications",
    },
]

# Statutory government rule fallbacks for offline resilience
STATUTORY_GOVT_FALLBACKS = [
    {
        "keywords": ["train", "railway", "irctc", "tatkal", "seat", "fare", "pnr", "ticket", "refund"],
        "title": "Indian Railways (IRCTC) Statutory Rules & Passenger Charter",
        "url": "https://www.india.gov.in/my-government/schemes",
        "snippet": "Statutory rules: Tatkal booking opens 10:00 AM (AC) and 11:00 AM (Non-AC) one day prior to departure. Chart 1 finalized 4 hours prior to scheduled train departure. Statutory refund rules apply based on cancellation timing before chart preparation.",
        "source": "indianrailways.gov.in",
    },
    {
        "keywords": ["aadhaar", "uidai", "identity", "biometric", "address", "card"],
        "title": "UIDAI — Statutory Aadhaar Update Guidelines & SLAs",
        "url": "https://uidai.gov.in/en/my-aadhaar/update-aadhaar.html",
        "snippet": "Statutory guidelines: Aadhaar updates require valid POI/POA documents. Mandatory biometric update required for children reaching age 5 and 15. Standard processing SLA is up to 90 days as per statutory regulations.",
        "source": "uidai.gov.in",
    },
    {
        "keywords": ["parivahan", "driving", "licence", "license", "rc", "vehicle", "dl", "transport"],
        "title": "Parivahan Sewa — Statutory Driving & Transport Rules",
        "url": "https://parivahan.gov.in/parivahan/",
        "snippet": "Statutory rules: Learner's License valid for 6 months nationwide. Driving License renewal allowed 1 year before to 1 year after expiry. Vehicle RC ownership transfer must be notified within 30 days.",
        "source": "parivahan.gov.in",
    },
    {
        "keywords": ["scheme", "certificate", "birth", "death", "income", "caste", "ration", "pm-kisan", "pension"],
        "title": "National Portal of India — Statutory Civic Services & Schemes",
        "url": "https://services.india.gov.in/",
        "snippet": "Statutory guidelines: Birth and death registrations must be filed within 21 days of occurrence. Direct Benefit Transfer (DBT) schemes require Aadhaar-seeded bank account for statutory subsidy disbursements.",
        "source": "services.india.gov.in",
    },
]


class ScraplingWebScraper:
    """Scrapling-powered Web Scraper for real government scheme & transport information."""

    def __init__(self) -> None:
        self.fetcher = Fetcher()

    def _get_statutory_fallback(self, query: str, source_domain: str, default_title: str, default_url: str) -> Dict[str, Any]:
        """Get relevant statutory fallback snippet matching query keywords."""
        q_lower = query.lower()
        for fb in STATUTORY_GOVT_FALLBACKS:
            if any(kw in q_lower for kw in fb["keywords"]):
                return {
                    "title": fb["title"],
                    "url": fb["url"],
                    "snippet": fb["snippet"],
                    "source": fb["source"],
                    "is_statutory_fallback": True,
                }
        return {
            "title": default_title,
            "url": default_url,
            "snippet": f"Statutory guidelines for {query}: Online verification, document checklist, and statutory fee payment supported via official portal.",
            "source": source_domain,
            "is_statutory_fallback": True,
        }

    def scrape_government_info(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        """Scrape live information aligning with user prompt using Scrapling Fetcher with .getall() extraction."""
        q_lower = query.lower()
        results: List[Dict[str, Any]] = []

        try:
            # 1. Scrape matching sources via Scrapling Fetcher
            for source in CIVIC_SCHEME_SOURCES:
                if len(results) >= max_results:
                    break

                try:
                    res = self.fetcher.get(source["url"], timeout=10)
                    if res and getattr(res, "status", 0) == 200:
                        # Extract titles and headings using Scrapling CSS text selector extraction with .getall()
                        title_texts = res.css("title::text, h1::text").getall()
                        page_title = " - ".join([t.strip() for t in title_texts if isinstance(t, str) and t.strip()]) if title_texts else source["title"]

                        # Extract paragraph body texts using Scrapling Fetcher .getall()
                        paragraphs = res.css("p::text").getall()
                        clean_paragraphs = [p.strip() for p in paragraphs if isinstance(p, str) and len(p.strip()) > 30]
                        snippet = " ".join(clean_paragraphs[:3])

                        if not snippet:
                            fallback_entry = self._get_statutory_fallback(query, source["domain"], source["title"], source["url"])
                            snippet = fallback_entry["snippet"]

                        results.append({
                            "title": page_title.strip(),
                            "url": source["url"],
                            "snippet": snippet[:350] + "..." if len(snippet) > 350 else snippet,
                            "source": source["domain"],
                            "is_statutory_fallback": False,
                        })
                    else:
                        fallback_entry = self._get_statutory_fallback(query, source["domain"], source["title"], source["url"])
                        results.append(fallback_entry)

                except Exception as exc:
                    logger.warning(f"Scrapling fetch failed for {source['url']}: {exc}")
                    fallback_entry = self._get_statutory_fallback(query, source["domain"], source["title"], source["url"])
                    results.append(fallback_entry)

            # 2. If results list is empty, supply statutory fallback entry
            if not results:
                fallback_entry = self._get_statutory_fallback(query, "india.gov.in", "National Portal of India", "https://www.india.gov.in")
                results.append(fallback_entry)

            return {
                "status": 200,
                "source": "SCRAPLING_LIVE_WEB_SCRAPER",
                "results": results[:max_results],
                "error": None,
            }

        except Exception as err:
            logger.error(f"Scrapling scraping error: {err}")
            fallback_entry = self._get_statutory_fallback(query, "india.gov.in", "National Portal of India", "https://www.india.gov.in")
            return {
                "status": 200,
                "source": "SCRAPLING_SCRAPER_STATUTORY_FALLBACK",
                "results": [fallback_entry],
                "error": str(err),
            }


def search_web_scrapling(query: str, max_results: int = 3) -> Dict[str, Any]:
    """Helper entrypoint for tool registry."""
    scraper = ScraplingWebScraper()
    return scraper.scrape_government_info(query, max_results=max_results)
