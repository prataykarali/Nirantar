"""
NIRANTAR — Local Ollama LLM Provider (₹0 Local-First)
=====================================================
Uses local Ollama runtime (e.g. Qwen 2.5, Llama 3.2, Gemma).
Requires zero internet and zero cloud API spend.
"""

import json
from typing import Any, Dict, Optional
from contracts.citizen import CitizenIntent
from contracts.prediction import PredictionResult
from .base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    """Local Ollama LLM adapter for ₹0 edge & desktop execution."""

    def __init__(self, model_name: str = "qwen2.5:0.5b", base_url: str = "http://localhost:11434") -> None:
        self.model_name = model_name
        self.base_url = base_url

    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        """Call local Ollama endpoint or degrade gracefully to deterministic fallback."""
        try:
            import urllib.request
            prompt = (
                f"Extract civic railway intent in JSON from: '{query}'. "
                "Output JSON with keys: intent_type, source_station, destination_station, quota, language."
            )
            payload = json.dumps({"model": self.model_name, "prompt": prompt, "stream": False, "format": "json"}).encode("utf-8")
            req = urllib.request.Request(f"{self.base_url}/api/generate", data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                res_obj = json.loads(data.get("response", "{}"))
                return CitizenIntent(
                    intent_type=res_obj.get("intent_type", "SEARCH_TRAINS"),
                    source_station=res_obj.get("source_station", "HWH"),
                    destination_station=res_obj.get("destination_station", "NDLS"),
                    travel_date=res_obj.get("travel_date", "2026-08-22"),
                    quota=res_obj.get("quota", "GN"),
                    language=language,
                    confidence=0.92,
                    raw_query=query,
                )
        except Exception:
            return self.deterministic_fallback_extract(query, language)

    def explain_prediction(self, prediction: PredictionResult) -> str:
        """Generate explainability summary."""
        factors = ", ".join([f"{f.feature_name} ({f.percentage_contribution}%)" for f in prediction.top_shap_factors[:3]])
        return (
            f"Overload risk is {prediction.forecast.overload_probability * 100:.1f}%. "
            f"Primary contributing factors: {factors or 'elevated concurrent transactions'}."
        )
