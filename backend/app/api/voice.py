"""
NIRANTAR — Voice & Speech API (Murf TTS & Deepgram STT)
=========================================================
Provides real-time Text-to-Speech via Murf API and Speech-to-Text via Deepgram.
Gracefully falls back to deterministic/browser speech synthesis if network is offline.
"""

import os
import base64
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/voice", tags=["Voice & Speech"])

MURF_API_KEY = os.getenv("MURF_API_KEY", "").strip()
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "").strip()


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

    api_key = os.getenv("MURF_API_KEY", MURF_API_KEY).strip()

    # Try Murf API
    if api_key:
        try:
            headers = {
                "api-key": api_key,
                "token": api_key,
                "Authorization": f"Bearer {api_key}" if not api_key.startswith("Bearer") else api_key,
                "Content-Type": "application/json",
            }
            payload = {
                "text": req.text[:500],  # keep concise for real-time speech
                "voiceId": req.voice_id or "en-IN-aarav",
                "style": "Conversational",
                "format": "MP3",
                "sampleRate": 24000,
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.murf.ai/v1/speech/generate",
                    headers=headers,
                    json=payload,
                )
                if res.status_code == 200:
                    data = res.json()
                    audio_url = data.get("audioFile") or data.get("audio_url")
                    if not audio_url and data.get("encodedAudio"):
                        audio_url = f"data:audio/mp3;base64,{data.get('encodedAudio')}"

                    if audio_url:
                        return {
                            "status": 200,
                            "audio_url": audio_url,
                            "source": "murf_api",
                            "text": req.text,
                        }
        except Exception as e:
            # Fall back to client-side speech synthesis
            print(f"Murf API call failed: {e}")

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

    api_key = os.getenv("DEEPGRAM_API_KEY", DEEPGRAM_API_KEY).strip()

    if api_key:
        try:
            clean_b64 = req.audio_base64.split(",", 1)[-1]
            audio_bytes = base64.b64decode(clean_b64)

            # Determine audio format
            content_type = "audio/webm"
            if "audio/wav" in req.audio_base64:
                content_type = "audio/wav"
            elif "audio/mp4" in req.audio_base64:
                content_type = "audio/mp4"
            elif "audio/ogg" in req.audio_base64:
                content_type = "audio/ogg"

            lang = "hi" if req.language == "hi" else "ta" if req.language == "ta" else "bn" if req.language == "bn" else "en-IN"

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language={lang}",
                    headers={
                        "Authorization": f"Token {api_key}",
                        "Content-Type": content_type,
                    },
                    content=audio_bytes,
                )
                if res.status_code == 200:
                    data = res.json()
                    channels = data.get("results", {}).get("channels", [])
                    first_channel = channels[0] if channels else {}
                    alternatives = first_channel.get("alternatives", [])
                    first_alt = alternatives[0] if alternatives else {}
                    transcript = first_alt.get("transcript", "")
                    confidence = first_alt.get("confidence", 0.96)
                    return {
                        "status": 200,
                        "transcript": transcript,
                        "confidence": confidence,
                        "source": "deepgram_api",
                    }
        except Exception as e:
            print(f"Deepgram STT call failed: {e}")

    return {
        "status": 200,
        "transcript": "",
        "confidence": 0,
        "source": "fallback",
    }
