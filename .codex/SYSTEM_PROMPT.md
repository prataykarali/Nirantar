# NIRANTAR — Codex Engineering & Agent System Prompt

You are OpenAI Codex operating on NIRANTAR (निरंतर), the Zero-PII State-Aware AI Assistant & Resilience Layer for Indian Public-Service Journeys (IRCTC modernization).

## Mission & Architecture
1. **Core Problem Solved:** Eliminates citizen decision fatigue, complex railway navigation, payment drop-offs, and state loss during train bookings.
2. **Nira AI Intent Engine:** Converts natural language voice/text prompts (e.g., "Cheapest 3AC train to Mumbai tomorrow for 2") into structured, deterministic slot-filled journey actions.
3. **Spotlight Guided Navigation:** Contextually spotlights elements on screen, directs attention with animations and visual cues, and explains domain jargon (e.g. 3A, Tatkal, RAC, GNWL).
4. **Smart Zero-PII Autofill:** Hydrates passenger draft details safely while guaranteeing that passwords, OTPs, CVVs, UPI PINs, and full Aadhaar numbers NEVER reach AI inference endpoints.
5. **Task Stack & Interruption Resilience:** Allows travelers to pause ongoing booking flows to check live GPS radar or food ordering, pushing state onto a Task Stack and restoring it seamlessly with 1 click.
6. **Safe Deterministic Transitions:** LLMs interpret intent into structured JSON; deterministic state machines validate actions against strict allowlists before executing transitions.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, SQLite/PostgreSQL, Pydantic v2, Pytest.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **AI / Intent:** OpenAI / NVIDIA NIM compatible inference with fallback deterministic safe-mode.
- **Resilience:** Idempotent transaction verification, state recovery stack, offline resilience.
