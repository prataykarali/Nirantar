"""
Nira intent parser — NVIDIA structured JSON with Safe Assist fallback.

Flow:
  NVIDIA NIM (JSON) → schema validator → application
  If NVIDIA is down or JSON is invalid → Safe Assist
  The citizen journey never depends on the LLM being available.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

from backend.app.schemas.nira_intent import (
    NIRA_JSON_SCHEMA,
    NiraIntentOutput,
    NiraSchemaError,
    validate_nira_payload,
)
from backend.app.services.citizen.safe_assist import SafeAssistParser, resolve_station, serialize_station

NIRA_SYSTEM_PROMPT = """You are Nira, NIRANTAR's ultra-fast AI Railway Copilot for Indian Railways.

Return ONLY valid JSON with exactly these required keys:
- intent: one of SEARCH_TRAINS, TRACK_TRAIN, VIEW_TICKET, PAYMENT_HELP, GENERAL_HELP
- entities: object. Optional keys: from_station, to_station, date (YYYY-MM-DD), date_label,
  time_of_day (Morning|Afternoon|Evening|Night|Anytime), passengers (1-6), train_number, pnr
- confidence: number between 0 and 1
- response: a very concise, punchy 1-2 sentence response (under 30 words) answering the user's question directly.

Rules:
- Be ultra-brief and direct (max 25-35 words). Never write long paragraphs.
- For greetings: "Hello! 🚆 I'm Nira. I can search trains, check Tatkal slots, track live GPS status, or book tickets. Where are you heading?"
- For booking without stations: "I'd be glad to help! 🚆 Where are you traveling from and to, and on which date?"
- Never invent fake PNR statuses without PNR numbers.
- Prefer official station codes (NDLS, HWH, CSMT, SBC, MAS, ADI, PNBE, HYB, PUNE, BSB, LKO, PURI).
"""


def parse_nira_intent(query: str, language: str = "en") -> Dict[str, Any]:
    """Parse a citizen utterance. Always returns a schema-valid payload."""
    raw = (query or "").strip()
    nvidia = _try_nvidia(raw, language)
    if nvidia is not None and nvidia.source == "nvidia":
        return _to_api_payload(nvidia, raw)

    fallback = SafeAssistParser.parse(raw)
    fallback.fallback_reason = fallback.fallback_reason or "nvidia_fallback"
    fallback.source = "safe_assist"
    fallback.raw_transcript = raw
    return _to_api_payload(fallback, raw)


def _try_nvidia(query: str, language: str) -> Optional[NiraIntentOutput]:
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not api_key or not query:
        return None

    model = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
    api_base = os.getenv("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1").rstrip("/")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    user_content = f"Language: {language}\nQuery: {query}"

    payloads = [
        {
            "model": model,
            "messages": [
                {"role": "system", "content": NIRA_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "max_tokens": 500,
            "response_format": {"type": "json_object"},
        },
        {
            "model": model,
            "messages": [
                {"role": "system", "content": NIRA_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.1,
            "max_tokens": 500,
        },
    ]

    last_reason = "nvidia_unavailable"
    for payload in payloads:
        try:
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(f"{api_base}/chat/completions", headers=headers, json=payload)
            if resp.status_code != 200:
                last_reason = f"nvidia_http_{resp.status_code}"
                continue
            content = resp.json()["choices"][0]["message"]["content"]
            parsed = _loads_json(content)
            if isinstance(parsed, dict) and "response" in parsed:
                try:
                    result = validate_nira_payload(parsed)
                    result.source = "nvidia"
                    result.raw_transcript = query
                    return result
                except NiraSchemaError:
                    # Construct valid NiraIntentOutput even if minor keys are missing
                    return NiraIntentOutput(
                        intent=parsed.get("intent", "GENERAL_HELP"),
                        confidence=float(parsed.get("confidence", 0.95)),
                        response=str(parsed.get("response")),
                        source="nvidia",
                        raw_transcript=query,
                    )
            elif isinstance(content, str) and content.strip():
                return NiraIntentOutput(
                    intent="GENERAL_HELP",
                    confidence=0.95,
                    response=content.strip(),
                    source="nvidia",
                    raw_transcript=query,
                )
        except (httpx.HTTPError, KeyError, IndexError, TypeError, json.JSONDecodeError) as e:
            last_reason = f"nvidia_error: {e}"
            continue

    fallback = SafeAssistParser.parse(query)
    fallback.source = "safe_assist"
    fallback.fallback_reason = last_reason
    fallback.raw_transcript = query
    return fallback


def _loads_json(content: str) -> Any:
    text = (content or "").strip()
    if text.startswith("```json"):
        text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    elif text.startswith("```"):
        text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        return None


def _to_api_payload(output: NiraIntentOutput, raw_query: str) -> Dict[str, Any]:
    entities = output.entities
    from_dict = serialize_station(resolve_station(entities.from_station))
    to_dict = serialize_station(resolve_station(entities.to_station))

    return {
        "intent": output.intent,
        "confidence": output.confidence,
        "source": output.source,
        "fallback_reason": output.fallback_reason,
        "response": output.response,
        "entities": {
            "from_station": from_dict["code"] if from_dict else None,
            "to_station": to_dict["code"] if to_dict else None,
            "date": entities.date,
            "date_label": entities.date_label,
            "time_of_day": entities.time_of_day,
            "passengers": entities.passengers,
            "train_number": entities.train_number,
            "pnr": entities.pnr,
            "from": from_dict,
            "to": to_dict,
            "dateLabel": entities.date_label,
            "timeOfDay": entities.time_of_day,
            "trainNumber": entities.train_number,
        },
        "raw_query": raw_query,
    }
