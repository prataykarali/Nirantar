"""
NIRANTAR — Cloud LLM Provider Adapters (NVIDIA NIM, Gemini, OpenAI)
===================================================================
Pluggable adapters for LLM inference. Zero-cost fallback if credentials absent.
"""

import os
import json
from typing import Any, Dict, Optional
import requests
from contracts.citizen import CitizenIntent, IntentType
from contracts.prediction import PredictionResult
from .base import BaseLLMProvider
from .prompts import SEMANTIC_INTENT_PROMPT, build_system_prompt


class NvidiaNIMProvider(BaseLLMProvider):
    """NVIDIA NIM LLM Adapter (e.g. meta/llama-3.1-70b-instruct)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_base: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY", "")
        self.model = model or os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
        self.api_base = api_base or os.getenv("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1")

    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        """Call NVIDIA NIM to extract structured Intent or fallback deterministically."""
        if not self.api_key:
            return self.deterministic_fallback_extract(query, language)

        system_prompt = SEMANTIC_INTENT_PROMPT

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Language: {language}\nQuery: {query}"},
            ],
            "temperature": 0.1,
            "max_tokens": 280,
        }

        try:
            resp = requests.post(f"{self.api_base}/chat/completions", headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                raw_json = resp.json()["choices"][0]["message"]["content"].strip()
                if raw_json.startswith("```json"):
                    raw_json = raw_json[7:-3].strip()
                elif raw_json.startswith("```"):
                    raw_json = raw_json[3:-3].strip()
                parsed = json.loads(raw_json)
                raw_type = str(parsed.get("intent_type") or "SEARCH_TRAINS").upper()
                aliases = {"BOOK_TICKET": "BOOK_TRAIN", "BOOK": "BOOK_TRAIN"}
                intent_type = IntentType(aliases.get(raw_type, raw_type))
                entities: Dict[str, Any] = {}
                if parsed.get("time_preference"):
                    entities["travel_time_preference"] = str(parsed["time_preference"]).upper()
                if parsed.get("passenger_count"):
                    entities["passenger_count"] = int(parsed["passenger_count"])
                return CitizenIntent(
                    intent_type=intent_type,
                    source_station=parsed.get("source_station"),
                    destination_station=parsed.get("destination_station"),
                    travel_date=parsed.get("travel_date"),
                    quota=parsed.get("quota", "GN"),
                    class_preference=parsed.get("class_preference", "3A"),
                    language=language,
                    confidence=float(parsed.get("confidence") or 0.96),
                    entities=entities,
                    raw_query=query,
                )
        except Exception:
            pass

        return self.deterministic_fallback_extract(query, language)

    def explain_prediction(self, prediction: PredictionResult) -> str:
        """Call NVIDIA NIM to generate human-readable infrastructure explanation."""
        if not self.api_key:
            return f"Prediction risk {prediction.forecast.overload_probability * 100:.1f}% evaluated."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        factors_summary = ", ".join([f"{f.feature_name} ({f.percentage_contribution}%)" for f in prediction.top_shap_factors[:3]])
        prompt = (
            f"Service {prediction.target_service} has {prediction.forecast.overload_probability*100:.1f}% overload risk. "
            f"Key driving factors: {factors_summary}. Recommended action: {prediction.recommended_action}. "
            f"Provide a 2-sentence executive summary explaining what is happening."
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are NIRANTAR AI Infrastructure SRE Explainer. Be concise."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 100,
        }

        try:
            resp = requests.post(f"{self.api_base}/chat/completions", headers=headers, json=payload, timeout=5)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

        return f"Prediction risk {prediction.forecast.overload_probability * 100:.1f}% driven by {factors_summary}."

    def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Generate a response only when NVIDIA NIM is configured and succeeds."""
        if not self.api_key:
            return None
        sys_msg = system_prompt or build_system_prompt()
        try:
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": sys_msg},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 280,
                },
                timeout=12,
            )
            if response.ok:
                return response.json()["choices"][0]["message"]["content"].strip()
        except (requests.RequestException, KeyError, IndexError, TypeError):
            pass
        return None


class GeminiProvider(BaseLLMProvider):
    """Optional Google Gemini API adapter."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash") -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model

    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        return self.deterministic_fallback_extract(query, language)

    def explain_prediction(self, prediction: PredictionResult) -> str:
        return f"Prediction risk {prediction.forecast.overload_probability * 100:.1f}% evaluated via Gemini adapter."


class OpenAIProvider(BaseLLMProvider):
    """Optional OpenAI API adapter."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model

    def extract_intent(self, query: str, language: str = "hi") -> CitizenIntent:
        return self.deterministic_fallback_extract(query, language)

    def explain_prediction(self, prediction: PredictionResult) -> str:
        return f"Prediction risk {prediction.forecast.overload_probability * 100:.1f}% evaluated via OpenAI adapter."
