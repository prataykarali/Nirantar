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
        """Rule-based fallback when offline or LLM backend is unavailable."""
        q_lower = query.lower()
        intent_type = IntentType.SEARCH_TRAINS
        src: Optional[str] = None
        dst: Optional[str] = None

        # Check for booking keywords
        if any(w in q_lower for w in ("book", "ticket", "reserve", "booking", "tatkal")):
            intent_type = IntentType.BOOK_TRAIN
        elif any(w in q_lower for w in ("avail", "seats", "seat", "khali")):
            intent_type = IntentType.CHECK_AVAILABILITY
        elif any(w in q_lower for w in ("queue", "wait", "status", "pnr")):
            intent_type = IntentType.GET_QUEUE_STATUS

        # Station regex heuristic
        station_map = {
            "delhi": "NDLS", "ndls": "NDLS", "kolkata": "HWH", "howrah": "HWH",
            "mumbai": "BCT", "chennai": "MAS", "bengaluru": "SBC", "patna": "PNBE",
            "varanasi": "BSB", "lucknow": "LKO", "kanpur": "CNB",
        }

        matches = []
        for name, code in station_map.items():
            pos = q_lower.find(name)
            if pos != -1:
                matches.append((pos, code))
        matches.sort(key=lambda x: x[0])
        found = [m[1] for m in matches]
        if len(found) >= 2:
            src, dst = found[0], found[1]
        elif len(found) == 1:
            dst = found[0]

        quota = "TQ" if "tatkal" in q_lower else "GN"

        return CitizenIntent(
            intent_type=intent_type,
            source_station=src,
            destination_station=dst,
            travel_date="2026-08-22",
            quota=quota,
            language=language,
            confidence=0.85,
            raw_query=query,
        )

    def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Generate a grounded answer, or return None when no model is available.

        Returning ``None`` is intentional: the journey layer must never turn an
        unavailable model into an invented travel recommendation.
        """
        return None
