# 🇮🇳 NIRANTAR (निरंतर)
### The Railway Journey That Explains Itself

> **Core Problem**: Railway services are difficult to discover, understand, and navigate because users are expected to understand railway terminology, service structure, and complicated digital journeys.
>
> **Core Promise**: **Nirantar makes the railway journey explain itself.**
>
> *Every feature must answer*: Does this help the railway journey explain itself, guide the passenger, or recover when something goes wrong?

---

## 🏛️ Master System Architecture

```
                                  NIRANTAR
                 "The railway journey that explains itself"
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
             USER JOURNEY (4 PILLARS)           TRUST LAYER
                     │                               │
        ┌────────────┼────────────┐           ┌──────┼──────┐
        │            │            │           │      │      │
     DISCOVER    UNDERSTAND      ACT      Zero-PII Allowlist Fair Access
  "Where do I go?" "What does it "Help me   Redactor Action   Telemetry
        │          mean?"         do it"             Policy    Guard
        │            │            │
        │            │            └── Nira Intent Engine
        │            │                ├── Rule-Based Intent Parser (Offline Safe)
        │            │                ├── Optional AI (NVIDIA NIM / Ollama)
        │            │                ├── "I Understood" Verification Card
        │            │                └── Safe Autofill (Zero PII Exposure)
        │            │
        │            └── Nirantar Guide (Unified Assistance System)
        │                ├── Hover Glossary (Dotted-Line Terminology)
        │                ├── Explain Screen & Explain Ticket
        │                ├── "What Happens Next?" Outcome Engine
        │                ├── "I'm Stuck" 1-Click Triage Modal
        │                └── Spotlight Visual Overlay & Guidance Tour
        │
        └── Nirantar Discover (Service Hub)
            ├── Natural Language Intent Router
            ├── 20+ Official Indian Railway Digital Services
            └── Official Service Destinations (IRCTC, NTES, RailMadad)
                             │
                             ▼
                          RECOVER
             "Something went wrong. Now what?"
                             │
            ├── TaskStack Interruption Preservation (1-Click Restore)
            ├── Formal 6-Stage State Machine (IDLE → CONFIRMED)
            ├── Resilient Payment Bridge (UNKNOWN / TIMEOUT)
            └── "Don't Pay Twice" Safeguard & Auto-Verify
                             │
                             ▼
                    JOURNEY EXPERIENCE (Supporting Layer)
            ├── Live GPS Radar & Station Stoppage Timeline
            ├── Coach Composition Map (Platform Alignment)
            ├── e-Catering Food Order & Destination Alarm
            └── English Interface & Accessibility, Station Chime & Trip Sharing
```

---

## 🧠 The Deterministic Context Engine

```
                     CONTEXT ENGINE
                           │
              ┌────────────┼────────────┐
              │            │            │
           Explain       Guide        Intent
              │            │            │
         (Deterministic (Deterministic  │
          Knowledge)     Workflow)      │
                                        │
                                 ┌──────┴──────┐
                                 │             │
                             Rule-based       Nira
                               parser         AI
                             (Offline)     (Assistive)
                                 │             │
                                 └──────┬──────┘
                                        ▼
                                  Intent Router
```

### Why Deterministic Fallback Matters:
- **Zero LLM Dependency for Core Tasks**: Terminology explanations (`GNWL`, `RAC`, `3E`), screen guidance, journey state transitions, official service routing, TaskStack restoration, and payment timeout handling are **100% deterministic**.
- **Offline Safe Mode**: If the AI model or API connection is unreachable, Nirantar automatically executes rule-based intent parsing with zero degradation to search, booking, payment, or recovery.
- **Source Integrity**: Sourced directly from official Indian Railways Commercial Rules and NTES telemetry with live freshness attribution.

---

## 🎯 The 4 Pillars of Nirantar

| Pillar | Citizen Question | Core Capabilities |
|---|---|---|
| 🧭 **1. DISCOVER** | *"Where do I go?"* | Nirantar Discover, natural-language service matching, official service routing (IRCTC/NTES/RailMadad), service requirements and rules. |
| 🧠 **2. UNDERSTAND** | *"What does this mean?"* | Nirantar Explain (3-level progressive breakdown), dotted-line jargon tooltips, *"What Happens Next?"* outcome projection, *"Explain This Page"*, *"I'm Stuck"* triage, Spotlight guidance. |
| 🤖 **3. ACT** | *"Help me do it."* | Nira intent extraction, *"I Understood"* verification cards, zero-PII safe autofill, 1-click train comparison. |
| 🛡️ **4. RECOVER** | *"Something went wrong. Now what?"* | TaskStack interruption preservation, payment state machine (`UNKNOWN` / `TIMEOUT`), *"Don't Pay Twice"* safeguard, 1-click journey restore. |

---

## ⏱️ 90-Second Evaluator Presentation Arc

1. **0–15s (Hook: Discover)**:
   * Citizen asks: *"Tatkal kab khulta hai?"* or *"Where do I cancel my ticket?"*
   * Nirantar Discover instantly identifies the official service, displays prerequisites, and outlines opening timings.
2. **15–35s (UX Differentiator: Understand)**:
   * Citizen sees `RAC 27` with dotted underline.
   * Hovering opens Nirantar Explain: Level 1 (Meaning) $\rightarrow$ Level 2 (For You: 87% chance) $\rightarrow$ Level 3 (*What Happens Next?*: Chart preparation rules) $\rightarrow$ Level 4 (Deep Dive).
3. **35–60s (AI Intent: Act)**:
   * Citizen speaks: *"Book 2 tickets Delhi to Mumbai tomorrow evening."*
   * Nira extracts parameters and displays the **"I Understood"** verification card. Citizen confirms $\rightarrow$ Safe Autofill fills passenger details with Zero-PII boundary.
4. **60–85s (Engineering Depth: Recover)**:
   * Citizen gets interrupted to track a train $\rightarrow$ TaskStack preserves state.
   * Citizen taps `[Resume Booking ➔]` $\rightarrow$ exact booking state restored.
   * Simulate payment timeout $\rightarrow$ Nirantar displays *"Payment status uncertain. Don't pay again."* with safe status verification.
5. **85–90s (Closing Thesis)**:
   * *"Nirantar doesn't replace the railway system. It makes the railway journey explain itself."*

---

## 🛡️ Cross-Cutting Trust Layer

```
   CITIZEN INPUT (Voice / Text / Touch)
        │
        ▼
   ┌──────────────┐
   │ PiiRedactor  │ ──► Client-side strips Passwords, OTPs, CVVs, PINs & Aadhaar
   └──────────────┘
        │
        ▼  (Sanitized Context Only: Page, State, Train Number, Fare)
   ┌──────────────┐
   │   Nira AI    │ ──► Optional interpretation & suggestion layer
   └──────────────┘
        │
        ▼  (Structured Action Cues)
   ┌──────────────┐
   │ ActionPolicy │ ──► Validates actions against strict ALLOWLIST before execution
   └──────────────┘
        │
        ▼
   SECURE APPLICATION STATE
```

- **Zero-PII**: AI never receives passwords, OTPs, CVVs, or payment PINs.
- **Fair Access Guard**: Monitored telemetry protecting availability against burst traffic and automated bots.
- **State Integrity**: Formal state machine prevents skipped or illegal transitions.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ & pip

### 1. Backend Server
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Open Application
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **⚡ Demo Controls**: Click the **⚡ Demo Controls** button in the bottom-left corner for 1-click judging scenarios!

---

*Built with ❤️ for accessible, transparent, and resilient public service delivery.*

