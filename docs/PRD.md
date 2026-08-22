# NIRANTAR — Product Requirements Document

> **Product Scope:** Nirantar is frozen as an IRCTC-focused product, not a generic government portal.

## One-Line Product Definition

Nirantar is a safe AI-assisted railway journey layer that helps citizens find the right train, understand their options, complete booking with guided assistance, and recover safely from payment or system failures.

## Core Principle

AI assists the passenger; it never takes ownership of the passenger's identity, credentials, money, or final decisions.

---

## 1. The Problem

The problem isn't simply: "IRCTC is difficult." That's too generic. Nirantar targets four connected friction points:

- **A. Decision overload**: Users see trains, classes, quotas, timings, prices and availability but may struggle to decide what actually suits them.
- **B. Navigation friction**: Users often know what they want but don't know where to click next or what a particular field means.
- **C. Form/payment friction**: Repeatedly entering information and moving through separate stages creates opportunities for mistakes and loss of context.
- **D. System/fairness friction**: During high-demand periods, automated or unusually aggressive request patterns can create infrastructure pressure and potentially worsen access for ordinary users.

---

## 2. The Nirantar Solution

### Four Visible Capabilities

```
┌──────────────────────┐
│       NIRANTAR       │
└──────────┬───────────┘
           │
 ┌─────────┼─────────┐
 ↓         ↓         ↓
FIND     GUIDE     ASSIST
 │         │         │
 ↓         PAY       ↓
RECOVER    │       TRACK
 │         ↓
 └────► FAIR ACCESS
```

---

### MODULE 1 — NIRA INTENT ENGINE

#### User sees
🎙️ *"Where are you going?"*

The user can speak or type naturally.
**Example:** *"I need to go from Delhi to Mumbai tomorrow morning for two people."*

Nirantar converts that into structured intent:
```json
{
  "origin": "Delhi",
  "destination": "Mumbai",
  "date": "Tomorrow",
  "time": "Morning",
  "passengers": 2
}
```

Then: *"I understood this. Is that correct?"*

#### User controls
Edit → Confirm. Never silently execute a consequential action.

#### Requirements
- Speech-to-text input
- Text input
- Intent extraction
- Entity extraction
- Date/time normalization
- Passenger count extraction
- Confirmation before action
- Hindi/English-friendly architecture
- Graceful fallback if intent is ambiguous

#### AI Role
NVIDIA NIM LLM. NIM exposes OpenAI-compatible inference endpoints such as `/v1/chat/completions` and supports tool calling for compatible models.

#### Important Architecture
- `LLM → structured JSON → validator → application`
- **Never:** `LLM → arbitrary website action`

---

### MODULE 2 — TRAIN & TRAVEL FINDER

This is the decision-support brain. After understanding the request: *"Here are your best options."*
Instead of dumping results, Nirantar ranks them.

#### Example Options
- **Best overall:** Train A — ₹1,850 · 27h · Arrives Sunday 8 PM
- **Cheapest:** Train B — ₹1,420 · 31h
- **Fastest:** Train C — ₹2,050 · 24h

#### Comparison Dimensions
- Departure
- Arrival
- Duration
- Fare
- Class
- Availability
- Number of stops
- User's stated preference

#### Explainable Recommendation
> *"Recommended because: It fits your ₹2,000 budget and reaches Delhi before your requested time."*

#### Important Rule
Don't let the LLM invent train data.

**Architecture:**
```
Mock / permitted data source ↓ Structured train records ↓ Filtering + ranking ↓ NVIDIA NIM ↓ Human-readable explanation
```
The LLM explains the result; it doesn't fabricate the result.

---

### MODULE 3 — GUIDED JOURNEY NAVIGATION

This is one of Nirantar's strongest UX differentiators.
Instead of *"Go to passenger details"*, Nira visually points:
`→ Enter passenger details here` with an animated arrow / highlight.

#### Journey Indicator
`SEARCH ✓ TRAIN ✓ PASSENGERS ● REVIEW ○ PAYMENT ○ CONFIRM ○`

The user should always know:
- Where am I?
- What am I doing?
- What happens next?

#### Nira Contextual Help
- If user asks: *"What's 3A?"* → Nira explains 3A.
- On passenger details: *"Why do you need this?"* → Nira explains the field.
- At payment: *"What happens after this?"* → Nira explains the payment flow.

This makes AI contextual, rather than a generic chatbot.

---

### MODULE 4 — SAFE AI AUTOFILL

This is your first major technical differentiator.
User says: *"Same passenger details as my saved profile."*
Nirantar can prepare safe fields. But there is a hard security boundary.

#### AI MAY HANDLE
- Name, where appropriate in the prototype
- Age
- Gender
- Journey preference
- Seat preference
- Origin
- Destination
- Date
- Non-sensitive booking preferences

#### AI MUST NOT HANDLE
- ❌ Password
- ❌ OTP
- ❌ CVV
- ❌ UPI PIN
- ❌ Card number
- ❌ Bank credentials
- ❌ Session cookies
- ❌ Authentication tokens
- ❌ Real Aadhaar/PAN data

#### Security Model
```
USER ↓ Voice / Text ↓ Intent Parser ↓ Structured Intent
      │
┌─────┴──────┐
↓            ↓
SAFE DATA    SENSITIVE DATA
↓            ↓
AI OK        AI BLOCKED
↓            ↓
Autofill     User-only UI
```

The important claim isn't *"We promise the AI won't leak credentials"*, but *"The AI never receives the credentials."* That is much stronger.

---

### MODULE 5 — SAFE ACTION ENGINE

Nira Safe Assist: The LLM is not the controller; it is an interpreter.

#### Example
User: *"Find trains from Delhi to Mumbai."*
LLM produces:
```json
{
  "action": "SEARCH_TRAINS",
  "origin": "Delhi",
  "destination": "Mumbai",
  "date": "2026-08-23"
}
```

Then your deterministic backend checks:
- Is `SEARCH_TRAINS` allowed?
- Are all parameters valid?
- Is date valid? Is destination valid?
- Does this action require confirmation?
- Does it touch sensitive data?

Only then:
```
VALIDATED ACTION ↓ ALLOWLIST ↓ API / MOCK API ↓ UI
```

**Why this is important:**
You can tell judges: *"Nirantar does not give the LLM unrestricted browser or transaction control."* This significantly improves the safety story.

---

### MODULE 6 — CONTINUOUS BOOKING & PAYMENT

This is the signature Nirantar experience. The prototype should feel like:
`SEARCH ↓ TRAIN ↓ PASSENGER ↓ REVIEW ↓ PAYMENT ↓ CONFIRMATION` without losing journey context.

For the hackathon, payment is simulated.

#### Payment State Machine
```
PAYMENT_READY ↓ PAYMENT_INITIATED ↓ PROCESSING
  │        ┌──────┼─────────┐
  ↓        ↓      ↓         ↓
  OK     FAILED UNKNOWN     │
  │        │      │         ↓
  ↓        ↓      ↓       BOOK
RETRY   VERIFY   BOOKED
```

#### Signature UX
If payment becomes uncertain:
> ⚠️ *Don't pay again. We couldn't confirm your previous transaction yet. [Check payment status]*

Then:
> *Payment confirmed ✓ Your booking is being completed.*

This is a much stronger product story than simply creating a pretty payment page.

---

### MODULE 7 — FAIR ACCESS GUARD

This is where the PortalPulse connection enters.
Don't tell users: *"We block AI agents."* Call it **Fair Access Guard**.

**Purpose:** Detect abnormal automated traffic patterns and protect system availability for normal users.

#### Signals Monitored
PortalPulse-style telemetry can monitor:
- Requests/sec
- Concurrent sessions
- Latency
- Error rate
- Queue depth
- Traffic bursts
- Repeated request patterns
- Unusually rapid interaction sequences
- Abnormal session behavior

#### Workflow
```
Normal traffic ↓ Normal access
Sudden abnormal burst ↓ Anomaly detected ↓ Rate limiting / verification ↓ Protect service capacity
```
*"The system detects suspicious traffic behavior and applies proportionate controls."*

---

### MODULE 8 — PORTALPULSE INTELLIGENCE LAYER

PortalPulse operates behind Nirantar and supplies:
- **Predictive capacity:** Is the booking system likely to become overloaded?
- **Anomaly detection:** Is traffic behaving abnormally?
- **Infrastructure monitoring:** Is latency/error rate rising?
- **Fair-access signals:** Is automated request activity creating unusual pressure?

#### Architecture
```
NIRANTAR (Citizen Experience)
  │
 ┌┴──────────────┬──────────────┐
 ↓               ↓              ↓
AI BOOKING    PAYMENT      FAIR ACCESS GUARD
                                │
                          PORTALPULSE
           ┌────────────────────┼────────────────────┐
           ↓                    ↓                    ↓
    Anomaly Engine     Capacity Prediction    Detection Monitor
```

---

### MODULE 9 — JOURNEY TRACKER

After booking:
```
Your journey:
✓ Journey planned
✓ Train selected
✓ Passenger details
✓ Payment confirmed
✓ Ticket booked
```
Then display PNR, Train, Departure, Platform / status (mocked if necessary).

**Continuity:** Nirantar remembers: What did I do? What happened? What happens next?

---

### MODULE 10 — AI TRANSPARENCY & SECURITY

**"What did Nira do?"**
```
✓ Understood your destination
✓ Found matching trains
✓ Compared price and duration
✓ Recommended Train A
✓ Filled safe booking fields
🔒 Nira did NOT access: Password, OTP, Card details, UPI PIN
```
Provides explainability, trust, security, and transparency.

---

## User Journey — Keep It Simple

From the citizen's perspective, don't show all 10 modules. They see:
1. TELL NIRA
2. FIND MY TRAIN
3. HELP ME CHOOSE
4. FILL THE SAFE PARTS
5. SHOW ME WHERE TO GO
6. PAY SAFELY
7. RECOVER IF SOMETHING GOES WRONG
8. GIVE ME MY TICKET

---

## USP Stack

1. **USP 1 — Speak instead of search:** Natural voice/text → structured journey.
2. **USP 2 — AI that assists, not controls:** Nira can understand and prepare actions but cannot access credentials or independently execute sensitive transactions.
3. **USP 3 — Never lose your place:** The Journey Continuity Layer keeps the user oriented through booking and payment.
4. **USP 4 — Don't pay twice:** Payment uncertainty becomes a recoverable state rather than a panic-inducing failure.
5. **USP 5 — Fair access by design:** PortalPulse detects abnormal system pressure and automation patterns so the system can respond proportionately.

---

## Tech Stack

- **Frontend:** Next.js / React, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Web Speech API
- **Backend:** Python + FastAPI
  - Modules: `/api/intent`, `/api/trains`, `/api/journey`, `/api/autofill`, `/api/payment`, `/api/fair-access`, `/api/telemetry`, `/api/assistant`
- **AI Engine:** NVIDIA NIM API (Server-side execution, OpenAI-compatible `/v1/chat/completions`)
  - Architecture: `Nirantar Backend → NVIDIA NIM API → LLM → Structured JSON → Schema Validator → Safe Action Engine`
- **Web Data Layer:** Scrapling (adaptive Python scraping framework for permitted public data ingestion)
- **Data Layer:** PostgreSQL (Tables: `users`, `journeys`, `trains`, `stations`, `passengers`, `bookings`, `payments`, `payment_events`, `ai_actions`, `telemetry_events`, `fair_access_events`)
- **Cache / Real-Time:** Redis (Session state, journey state, payment state, rate limiting, temporary AI context, telemetry counters)
- **ML / Telemetry:** PortalPulse ML models (Capacity prediction, anomaly detection, Fair Access Guard)

---

## The Most Important AI Boundary

```
┌──────────────────┐
│      NIRA        │
│      LLM         │
└────────┬─────────┘
         │ NEVER RECEIVES
┌────────┴─────────┐
│ Password OTP     │
│ Payment Secrets  │
└──────────────────┘
  BLOCKED BY DESIGN
```

---

## MVP Priority

### 🔴 MUST WORK
1. Voice/text intent
2. Train finder
3. Explainable comparison
4. Guided booking
5. Safe autofill
6. Payment state machine
7. Unknown-payment recovery
8. Complete ticket journey

### 🟡 SHOULD WORK
9. Exact-location visual guidance
10. AI action log
11. Fair Access Guard
12. PortalPulse telemetry simulation

### 🟢 DEMO ENHANCEMENTS
13. Animated Nira
14. Multilingual interaction
15. Accessibility features
16. System-load visualization
17. Advanced train comparison

---

## Final Architecture

```
                      ┌───────────────┐
                      │     USER      │
                      └───────┬───────┘
                              │ Voice / Text / UI
                              ↓
                      ┌─────────────────┐
                      │   NIRA ASSIST   │
                      │ NVIDIA NIM LLM  │
                      └────────┬────────┘
                               │ Structured Intent
                               ↓
                      ┌───────────────────┐
                      │   ACTION GUARD    │
                      │ Schema + Allowlist│
                      └─────────┬─────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ↓                     ↓                     ↓
     TRAIN ENGINE        JOURNEY ENGINE        AUTOFILL ENGINE
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ↓
                      PAYMENT STATE MACHINE
                                │
                      ┌─────────┼─────────┐
                      ↓         ↓         ↓
                    PASS      FAIL     UNKNOWN
                      │         │         │
                      ↓         ↓         │
                    BOOK      RETRY       │
                      │                   ↓
                      │                 VERIFY
                      │                   │
                      └─────────┬─────────┘
                                ↓
                             BOOKED
                                │
                                ↓
                      ┌─────────────────┐
                      │   FAIR ACCESS   │
                      │      GUARD      │
                      └────────┬────────┘
                               ↓
                      ┌──────────────┐
                      │ PORTALPULSE  │
                      │ ML+TELEMETRY │
                      └──────────────┘
```

---

## Product Positioning

- **Tagline:** NIRANTAR — Your railway journey, without the guesswork. Find. Understand. Book. Recover.
- **Summary:** An AI-assisted journey layer that helps ordinary passengers make better booking decisions, safely automates only low-risk steps, keeps payment and navigation continuous, and uses infrastructure intelligence to promote fair access during high-demand periods.
