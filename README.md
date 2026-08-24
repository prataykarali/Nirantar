# 🇮🇳 NIRANTAR (निरंतर)
### State-Aware AI Assistant & Resilience Layer for Indian Public-Service Journeys

> **Problem**: Complex public-service portals force citizens to navigate dozens of fragmented screens, decipher railway terminology, fill redundant forms, and recover manually from network failures or payment timeouts.
>
> **Solution**: NIRANTAR introduces **Nira** — a state-aware AI journey orchestrator that understands where you are on the screen, shows you the next step with spotlight guidance, preserves your journey across interruptions, and protects your financial credentials behind a zero-PII security boundary.

---

## 🎯 The 90-Second "Aha Moment"

```
Citizen: "Book me the cheapest train to Mumbai tomorrow evening for two."
   ↓
[1. UNDERSTAND]   Nira extracts origin, destination, date, time & passenger count
   ↓
[2. SHOW]         Nira renders "I Understood" verification card + Best Match (#12952)
   ↓
[3. GUIDE]        Spotlight dims screen & arrows point directly at controls
   ↓
[4. AUTOFILL]     Nira autofills passenger drafts without touching PII/credentials
   ↓
[5. INTERRUPT]    Citizen says: "Actually, track my previous train #12302"
   ↓
[6. PRESERVE]     Nira pauses booking, pushes state to Task Stack, opens Live GPS Radar
   ↓
[7. RESUME]       Citizen taps [Resume Booking →] — exact booking state restored instantly!
   ↓
[8. PAY & TICKET] Payment succeeds → DigiLocker-verified e-Ticket generated with PNR
```

---

## ⚖️ What Is Real vs. What Is Mocked (Complete Honesty)

| Layer | Implementation Status | Technical Details |
|---|---|---|
| **Frontend Interactions** | 🟢 **100% Real** | React 18, Vite, TypeScript, Tailwind CSS, Smooth UI |
| **State Machine & Orchestration** | 🟢 **100% Real** | Formal state machine (`IDLE` $\rightarrow$ `SEARCH` $\rightarrow$ `SELECTION` $\rightarrow$ `PASSENGERS` $\rightarrow$ `PAYMENT` $\rightarrow$ `CONFIRMED`) |
| **Nira AI & Slot Filling** | 🟢 **100% Real** | NLP slot-filling, intent classification, zero-PII sanitizer |
| **Task Stack & Recovery** | 🟢 **100% Real** | Cross-screen interruption preservation and 1-click state restore |
| **Database & OAuth** | 🟢 **100% Real** | SQLAlchemy ORM, SQLite/PostgreSQL, Google OAuth & DigiLocker auth |
| **Payment State Machine** | 🟢 **100% Real** | Success, Failure (state preserved), Unknown/Timeout handling |
| **Voice TTS & Indian Railway Chime** | 🟢 **100% Real** | Web Speech API synthesis + 4-tone Web Audio API railway chime |
| **Railway Inventory & Availability** | 🟡 **Normalized Synthetic** | 85+ stations, 550+ trains with multi-class seat quotas |
| **Bank Payment Gateway** | 🟡 **Simulated Protocol** | Idempotency key tracking, 0-PIN Virtual Citizen Wallet |
| **Government Portal Integration** | 🟡 **Architectural Prototype** | Sits in front of public portals as a safe citizen interaction layer |

---

## 🛡️ "Nira Safe" Zero-PII Security Boundary

```
   CITIZEN INPUT
        │
        ▼
   ┌──────────────┐
   │ PiiRedactor  │ ──► Strips Passwords, OTPs, CVVs, PINs & Aadhaar numbers
   └──────────────┘
        │
        ▼  (Sanitized Context Only: Page, State, Train Number, Fare)
   ┌──────────────┐
   │   Nira AI    │ ──► Generates suggestions, navigations, and spotlight cues
   └──────────────┘
        │
        ▼  (Action Cues)
   ┌──────────────┐
   │ ActionPolicy │ ──► Validates actions against strict ALLOWLIST before execution
   └──────────────┘
        │
        ▼
   SECURE APPLICATION STATE
```

- **Nira NEVER sees passwords, OTPs, CVVs, or payment PINs.**
- **The LLM CANNOT force illegal state transitions.**
- **Offline Resilient**: If AI/LLM is unreachable, NIRANTAR seamlessly falls back to local deterministic safe-mode with zero degradation to search, booking, payment, or recovery.

---

## 🏛️ System Architecture

```
                         ┌──────────────────────────┐
                         │         CITIZEN          │
                         │   Voice / Text / Touch   │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │   M1: CITIZEN UX LAYER   │
                         │  Spotlight · Stepper · UI│
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M2: JOURNEY ORCHESTRATOR│
                         │  State Machine · TaskStack│
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │ M3: ZERO-PII SAFETY RING │
                         │ PiiRedactor · Allowlist  │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M4: PERSISTENT DATABASE │
                         │ SQLite / PostgreSQL ORM  │
                         └──────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

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
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Demo Controls**: Click the **⚡ Demo Controls** button in the bottom-left corner for instant 1-click test scenarios during presentations!

---

## 👥 Product Defense & Key Questions

### "Why not just ChatGPT?"
> **ChatGPT can tell you what to do. Nirantar knows where you are in the application journey and guides you through the live interface.** ChatGPT has no knowledge of your current screen, cannot preserve your booking when interrupted, and cannot guarantee safety on consequential actions.

### "Why not just IRCTC?"
> **We are not replacing the underlying railway infrastructure. We are exploring a safer, state-aware citizen interaction layer on top of complex public services.**

### "Why does this need AI?"
> **The AI handles the ambiguity of natural human requests ("cheapest evening train for two"); deterministic software handles state, permissions, transaction safety, and consequential actions.**

---

*Built with ❤️ for accessible, resilient, and inclusive public service delivery.*
