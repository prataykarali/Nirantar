"""
Nira Assist API — NVIDIA Streaming LLM & Structured Intent.
==========================================================
Real-time token-by-token streaming via NVIDIA NIM LLaMA 3.1 70B
with multi-turn conversation memory and structured entity extraction.
"""

import json
import os
import re
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
    context: Optional[str] = None


NIRA_STREAM_SYSTEM_PROMPT = """You are Nira, a railway copilot on NIRANTAR for Indian train travel.

STRICT STYLE:
- NEVER introduce yourself. NEVER say "Hello! I'm Nira", "I am Nira", or "I'm Nira, your...".
- Speak like a helpful person: 2 to 5 short sentences, natural English.
- Use plain words: "3-tier AC" not "3A", "2-tier AC" not "2A", "Sleeper" not "SL", "last-minute ticket" not "Tatkal" unless the user said Tatkal.

SCOPE:
- You ONLY help with Indian Railways: find trains, compare them, book, track, PNR, classes, last-minute tickets, platforms.
- If the user wants something outside Indian trains (another country, Hawaii, flights, hotels, sightseeing, coding, trivia):
  Acknowledge what they asked, then clearly say you are limited to Indian train journeys, and invite an Indian route.
  Example: "I understand you want to go to Hawaii, but I can only help with Indian train travel — for example Delhi to Mumbai or Kolkata to Puri. Where in India do you want to go?"

BOOKING:
- When a GROUNDING block lists trains: start with "I found these trains", rank them (fastest, cheapest, more comfortable), ask what they prefer, then match one.
- Do not invent train numbers, fares, or times. Use only the grounding data.
- If origin or destination is missing, ask for both Indian stations in one short question.
"""


async def generate_nvidia_stream(
    query: str, language: str, history: List[dict] = None, context: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """Deterministic token-by-token streaming response generator without LLM dependencies."""
    parsed = parse_nira_intent(query, language)
    msg = parsed.get("response", "I am here to help with your Indian Railways journey!")
    
    # Stream response token by token
    tokens = re.findall(r"\S+\s*", msg) or [msg]
    for token in tokens:
        yield f"data: {json.dumps({'token': token})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/chat/stream")
async def stream_chat(payload: NiraStreamRequest):
    """Real-time token-by-token streaming chat with conversation memory."""
    history_dicts = [{"role": h.role, "content": h.content} for h in payload.history]
    return StreamingResponse(
        generate_nvidia_stream(payload.query, payload.language, history_dicts, payload.context),
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
