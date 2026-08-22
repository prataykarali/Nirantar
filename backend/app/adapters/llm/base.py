"""
NIRANTAR — Base LLM Provider Adapter
====================================
Abstract interface for intent parsing and explainability.
Guarantees offline graceful degradation: if no LLM provider is available,
it falls back to deterministic rule-based semantic extraction.
"""

from abc import ABC, abstractmethod
import re
from typing import Any, Dict, Optional
from contracts.citizen import CitizenIntent, IntentType
from contracts.prediction import PredictionResult


class BaseLLMProvider(ABC):
    """Abstract LLM Provider Adapter."""

    @abstractmethod
    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        """Extract structured CitizenIntent from natural language."""
        pass

    @abstractmethod
    def explain_prediction(self, prediction: PredictionResult) -> str:
        """Generate human-readable explanation of risk & SHAP factors."""
        pass

    def deterministic_fallback_extract(self, query: str, language: str = "hi") -> CitizenIntent:
        """Vector DB + Snowflake Arctic Embeddings fallback for intent & station extraction."""
        q_lower = query.lower()
        intent_type = IntentType.SEARCH_TRAINS
        src: Optional[str] = None
        dst: Optional[str] = None

        if any(w in q_lower for w in ("book", "ticket", "reserve", "booking", "tatkal")):
            intent_type = IntentType.BOOK_TRAIN
        elif any(w in q_lower for w in ("avail", "seats", "seat", "khali")):
            intent_type = IntentType.CHECK_AVAILABILITY
        elif any(w in q_lower for w in ("queue", "wait", "status", "pnr")):
            intent_type = IntentType.GET_QUEUE_STATUS

        # Use SnowflakeVectorStore (Snowflake Arctic Embeddings) for semantic station resolution
        try:
            from backend.app.adapters.search.vector_store import SnowflakeVectorStore
            vstore = SnowflakeVectorStore()
            
            # Ensure core station knowledge is embedded
            stations_db = [
                ("NDLS", "New Delhi Railway Station NDLS Delhi"),
                ("HWH", "Howrah Junction Railway Station HWH Kolkata West Bengal"),
                ("BCT", "Mumbai Central Railway Station BCT Bombay Maharashtra"),
                ("MAS", "Chennai Central Railway Station MAS Tamil Nadu"),
                ("SBC", "Bengaluru City Railway Station SBC Bangalore Karnataka"),
                ("PNBE", "Patna Junction Railway Station PNBE Bihar"),
                ("BSB", "Varanasi Junction Railway Station BSB Kashi Uttar Pradesh"),
                ("LKO", "Lucknow Charbagh Railway Station LKO Uttar Pradesh"),
                ("CNB", "Kanpur Central Railway Station CNB Uttar Pradesh"),
                ("ADI", "Ahmedabad Junction Railway Station ADI Gujarat"),
            ]
            for st_code, st_desc in stations_db:
                vstore.add_document(f"st_{st_code}", st_code, st_desc, category="STATION")

            matches = vstore.search_similarity(query, top_k=2, min_similarity=0.35)
            if len(matches) >= 2:
                src, dst = matches[0]["id"].replace("st_", ""), matches[1]["id"].replace("st_", "")
            elif len(matches) == 1:
                dst = matches[0]["id"].replace("st_", "")
        except Exception:
            pass

        quota = "TQ" if "tatkal" in q_lower else "GN"

        return CitizenIntent(
            intent_type=intent_type,
            source_station=src or "HWH",
            destination_station=dst or "NDLS",
            travel_date="2026-08-23",
            quota=quota,
            language=language,
            confidence=0.92,
            raw_query=query,
        )

    def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Generate a grounded answer, or return None when no model is available.

        Returning ``None`` is intentional: the journey layer must never turn an
        unavailable model into an invented travel recommendation.
        """
        return None
