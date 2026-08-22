"""
NIRANTAR — Semantic Orchestration Agent
=======================================
Python owns DB-first lookup and Apify fallback. NVIDIA NIM synthesizes
a grounded answer using the frozen system prompt. The model never admits traffic.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from backend.app.adapters.llm.prompts import build_system_prompt
from backend.app.adapters.llm.tools import get_tool_registry


@dataclass
class OrchestrationResult:
    """Grounded answer plus provenance for the citizen journey layer."""

    message: str
    source: str
    db_hits: List[Dict[str, Any]] = field(default_factory=list)
    web_results: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    used_llm: bool = False


class SemanticOrchestrationAgent:
    """DB → Scrapling Web Scraper → NVIDIA synthesis. Invisible handoffs. No hallucination."""

    SCRAPER_UNAVAILABLE_STATUSES = {429, 500, 503}

    def __init__(self) -> None:
        from backend.app.adapters.llm.cloud_adapters import NvidiaNIMProvider
        from backend.app.adapters.llm.ollama import OllamaProvider
        import os

        self.registry = get_tool_registry()
        provider = (os.getenv("LLM_PROVIDER") or "nvidia").lower()
        if provider == "ollama":
            self.llm = OllamaProvider()
        else:
            self.llm = NvidiaNIMProvider()

    def query_local_db(self, src: str, dst: str) -> List[Dict[str, Any]]:
        result = self.registry.call_tool("query_local_db", src=src, dst=dst)
        if isinstance(result, dict) and result.get("error"):
            return []
        return list(result or [])

    def search_web_scraper(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        return self.registry.call_tool("search_scrapling", query=query, max_results=max_results)

    def answer(
        self,
        query: str,
        language: str = "en",
        source_station: Optional[str] = None,
        destination_station: Optional[str] = None,
    ) -> OrchestrationResult:
        """Run the frozen workflow: DB first, Scrapling web scraper if incomplete, then synthesis."""
        db_hits: List[Dict[str, Any]] = []
        if source_station and destination_station:
            db_hits = self.query_local_db(source_station, destination_station)

        if db_hits:
            message = self._synthesize(query, language, db_hits, [], None)
            return OrchestrationResult(
                message=message,
                source="LOCAL_DIGITAL_TWIN",
                db_hits=db_hits,
                used_llm=self._llm_available(),
            )

        web_query = query
        if source_station and destination_station:
            web_query = (
                f"how to travel by train from {source_station} to {destination_station} "
                "route schedule connection"
            )
        web = self.search_web_scraper(web_query, max_results=3)
        status = int(web.get("status") or 0)
        web_results = list(web.get("results") or [])
        web_error = web.get("error")

        if status in self.SCRAPER_UNAVAILABLE_STATUSES or not web_results:
            fallback = self._unavailable_message(language, web_error)
            return OrchestrationResult(
                message=fallback,
                source="NO_VERIFIED_RESULT",
                error=str(web_error or f"Scraper status {status}"),
                web_results=web_results,
            )

        message = self._synthesize(query, language, [], web_results, web_error)
        return OrchestrationResult(
            message=message,
            source=str(web.get("source") or "SCRAPLING_LIVE_WEB_SCRAPER"),
            web_results=web_results,
            used_llm=self._llm_available(),
        )

    def _llm_available(self) -> bool:
        return bool(getattr(self.llm, "api_key", None) or getattr(self.llm, "base_url", None))

    def _synthesize(
        self,
        query: str,
        language: str,
        db_hits: List[Dict[str, Any]],
        web_results: List[Dict[str, Any]],
        error: Optional[str],
    ) -> str:
        user_turn = self._build_user_turn(query, language, db_hits, web_results, error)
        generate = getattr(self.llm, "generate_response", None)
        text: Optional[str] = None
        if callable(generate):
            try:
                text = generate(user_turn, system_prompt=build_system_prompt())
            except TypeError:
                text = generate(user_turn)
        if text:
            return text.strip()
        return self._deterministic_summary(language, db_hits, web_results, error)

    def _build_user_turn(
        self,
        query: str,
        language: str,
        db_hits: List[Dict[str, Any]],
        web_results: List[Dict[str, Any]],
        error: Optional[str],
    ) -> str:
        db_json = json.dumps(db_hits[:5], ensure_ascii=False, default=str)
        web_json = json.dumps(web_results[:3], ensure_ascii=False, default=str)
        timeout_note = error or "none"
        return (
            f"Citizen request: {query}\n"
            f"Language: {language}\n"
            f"Local DB context (complete if non-empty array): {db_json}\n"
            f"Apify context: {web_json}\n"
            f"Tool/timeout error: {timeout_note}\n"
            "Synthesize the final citizen-facing answer. Invisible handoffs. No invented facts."
        )

    def _deterministic_summary(
        self,
        language: str,
        db_hits: List[Dict[str, Any]],
        web_results: List[Dict[str, Any]],
        error: Optional[str],
    ) -> str:
        if db_hits:
            names = []
            for row in db_hits[:3]:
                label = row.get("train_name") or row.get("train_no") or "train"
                names.append(str(label))
            joined = ", ".join(names)
            if language == "hi":
                return f"स्थानीय सूची में ये विकल्प मिले: {joined}।"
            if language == "bn":
                return f"স্থানীয় তালিকায় এই বিকল্পগুলো পাওয়া গেছে: {joined}।"
            return f"Local catalogue matches: {joined}."
        if web_results:
            titles = [str(r.get("title") or "source") for r in web_results[:3]]
            joined = "; ".join(titles)
            if language == "hi":
                return f"सत्यापित स्रोत: {joined}। किराया या सीट संख्या अनुमानित नहीं है।"
            if language == "bn":
                return f"যাচাইকৃত উৎস: {joined}। ভাড়া বা আসন সংখ্যা অনুমান করা হয়নি।"
            return f"Verified sources: {joined}. No fare or seat count has been inferred."
        return self._unavailable_message(language, error)

    def _unavailable_message(self, language: str, error: Optional[str]) -> str:
        if language == "hi":
            return "नवीनतम डेटा के आधार पर मेरे पास इस प्रश्न का उत्तर देने के लिए वर्तमान में पर्याप्त जानकारी नहीं है।"
        if language == "bn":
            return "আমাদের সাম্প্রতিক তথ্যের ভিত্তিতে এই প্রশ্নের উত্তর দেওয়ার মতো তথ্য বর্তমানে উপলব্ধ নেই।"
        return "I currently do not have the information to answer this based on our latest data."
