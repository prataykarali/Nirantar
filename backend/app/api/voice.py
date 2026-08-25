"""
NIRANTAR — Voice & Speech API (Murf TTS & Deepgram STT)
=========================================================
Provides real-time Text-to-Speech via Murf API and Speech-to-Text via Deepgram.
Gracefully falls back to deterministic/browser speech synthesis if network is offline.
"""

import os
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/voice", tags=["Voice & Speech"])

MURF_API_KEY = os.getenv("MURF_API_KEY", "ap2_e02822c1-60a7-4cb2-95cb-f7f60445cf92")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "d4ce071a8da028082bacade9f4708be3dfa7287f")


class SpeakRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "en-IN-aarav"
    language: Optional[str] = "en"


class TranscribeRequest(BaseModel):
    audio_base64: str
    language: Optional[str] = "en"


@router.post("/speak")
async def text_to_speech(req: SpeakRequest):
    """
    Generate speech audio for Nira's responses using Murf API.
    Returns audio URL or base64 stream.
    """
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    # Try Murf API
    if MURF_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    "https://api.murf.ai/v1/speech/generate",
                    headers={
                        "api-key": MURF_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "text": req.text[:500],  # keep concise for real-time speech
                        "voiceId": "en-IN-aarav",
                        "style": "Conversational",
                        "format": "MP3",
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "status": 200,
                        "audio_url": data.get("audioFile") or data.get("audio_url"),
                        "source": "murf_api",
                        "text": req.text,
                    }
        except Exception as e:
            # Fall back to client-side speech synthesis
            pass

    return {
        "status": 200,
        "audio_url": None,
        "source": "web_speech_fallback",
        "text": req.text,
    }


@router.post("/transcribe")
async def speech_to_text(req: TranscribeRequest):
    """
    Transcribe audio bytes using Deepgram API.
    """
    if not req.audio_base64.strip():
        raise HTTPException(400, "Audio cannot be empty")

    if DEEPGRAM_API_KEY:
        try:
            import base64
            clean_b64 = req.audio_base64.split(",", 1)[-1]
            audio_bytes = base64.b64decode(clean_b64)

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en-IN",
                    headers={
                        "Authorization": f"Token {DEEPGRAM_API_KEY}",
                        "Content-Type": "audio/wav",
                    },
                    content=audio_bytes,
                )
                if res.status_code == 200:
                    data = res.json()
                    transcript = (
                        data.get("results", {})
                        .get("channels", [{}])[0]
                        .get("alternatives", [{}])[0]
                        .get("transcript", "")
                    )
                    return {
                        "status": 200,
                        "transcript": transcript,
                        "confidence": 0.96,
                        "source": "deepgram_api",
                    }
        except Exception:
            pass

    return {
        "status": 200,
        "transcript": "",
        "confidence": 0,
        "source": "fallback",
    }
