"""
Nira Assist API — NVIDIA Streaming LLM & Structured Intent.
==========================================================
Real-time token-by-token streaming via NVIDIA NIM LLaMA 3.1 70B
with multi-turn conversation memory and structured entity extraction.
"""

import json
import os
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.app.services.citizen.nira_parser import parse_nira_intent
from backend.app.services.citizen.safe_assist import resolve_station

router = APIRouter(prefix="/api/v1/nira", tags=["Nira Assist"])


class NiraParseRequest(BaseModel):
    query: str = Field(..., min_length=1)
    language: str = "en"
    session_id: Optional[str] = None


class ChatHistoryItem(BaseModel):
    role: str = "user"
    content: str = ""


class NiraStreamRequest(BaseModel):
    query: str = Field(..., min_length=1)
    language: str = "en"
    history: List[ChatHistoryItem] = []


NIRA_STREAM_SYSTEM_PROMPT = """You are Nira, NIRANTAR's ultra-fast AI Railway Copilot for Indian Railways.

STRICT CONVERSATIONAL RULES:
- Reply in 1-2 SHORT, DIRECT sentences (under 25 words).
- NEVER re-introduce yourself or say "Hello! I'm Nira" if the conversation has already started.
- When the user gives a route or date, acknowledge it directly in 1 sentence.
- For factual railway questions, answer directly with zero fluff.
"""


async def generate_nvidia_stream(query: str, language: str, history: List[dict] = None) -> AsyncGenerator[str, None]:
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    model = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
    api_base = os.getenv("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1").rstrip("/")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }

    # Build messages with proper role mapping
    messages = [{"role": "system", "content": NIRA_STREAM_SYSTEM_PROMPT}]

    if history:
        for item in history[-6:]:
            role = "assistant" if item.get("role") in ("assistant", "nira") else "user"
            content = (item.get("content") or "").strip()
            if content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": query})

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 80,
        "temperature": 0.1,
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            async with client.stream("POST", f"{api_base}/chat/completions", headers=headers, json=payload) as response:
                if response.status_code != 200:
                    fallback_result = parse_nira_intent(query, language)
                    msg = fallback_result.get("response", "I'm here to help with your railway journey!")
                    yield f"data: {json.dumps({'token': msg})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    if line == "data: [DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    if line.startswith("data: "):
                        try:
                            chunk_json = json.loads(line[6:])
                            delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                            content_token = delta.get("content", "")
                            if content_token:
                                yield f"data: {json.dumps({'token': content_token})}\n\n"
                        except Exception:
                            continue
    except Exception:
        fallback_result = parse_nira_intent(query, language)
        msg = fallback_result.get("response", "I'm here to help with your railway journey!")
        yield f"data: {json.dumps({'token': msg})}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/chat/stream")
async def stream_chat(payload: NiraStreamRequest):
    """Real-time token-by-token streaming chat with conversation memory."""
    history_dicts = [{"role": h.role, "content": h.content} for h in payload.history]
    return StreamingResponse(
        generate_nvidia_stream(payload.query, payload.language, history_dicts),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/intent")
def parse_intent(payload: NiraParseRequest) -> Dict[str, Any]:
    """Parse voice/text into schema-validated structured JSON."""
    result = parse_nira_intent(payload.query, payload.language)
    result["status"] = 200
    result["sessionId"] = payload.session_id
    return result
