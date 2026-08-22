NIRANTAR
SYSTEM & SOFTWARE ARCHITECTURE DOCUMENT
AI-Assisted IRCTC Journey Prototype
Architecture v1.0 • Hackathon Prototype • Synthetic/Mock Data


# 1. Architecture Objectives
Create one continuous railway citizen journey rather than a collection of disconnected portal screens.
Use AI for intent understanding, explanation and guidance without allowing the LLM to directly control sensitive actions.
Keep train facts, booking state and payment state deterministic and auditable.
Allow the data source to be replaced later without rewriting the citizen UI.
Integrate PortalPulse as an infrastructure intelligence layer rather than exposing its complexity to citizens.
Demonstrate meaningful AI, backend, security, data and infrastructure engineering within a hackathon-safe prototype.
# 2. Architectural Principles

# 3. High-Level Architecture
                         ┌───────────────────────────────┐
                         │          CITIZEN               │
                         │   Voice / Text / UI Actions    │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │     NIRANTAR WEB CLIENT       │
                         │ Next.js • React • TypeScript   │
                         │ UI • Journey • Nira Overlay    │
                         └───────────────┬───────────────┘
                                         │ HTTPS
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │             FASTAPI API LAYER            │
                    │ auth • sessions • journey • validation  │
                    └───────┬───────────────┬─────────────────┘
                            │               │
              ┌─────────────▼───┐      ┌───▼─────────────────┐
              │ NIRA AI GATEWAY  │      │ DETERMINISTIC CORE │
              │ NVIDIA NIM/API   │      │ train/booking/pay  │
              └────────┬─────────┘      └───────┬────────────┘
                       │                         │
                       ▼                         ▼
              Structured Intent          PostgreSQL / Redis
                       │                         │
                       └────────────┬────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ FAIR ACCESS GUARD   │
                         │ rate/queue/verify   │
                         └──────────┬──────────┘
                                    │ telemetry
                                    ▼
                         ┌─────────────────────┐
                         │     PORTALPULSE     │
                         │ prediction/anomaly  │
                         └─────────────────────┘
# 4. Logical Component Architecture

# 5. Frontend Architecture
Recommended frontend structure:
app/
├── (public)/
│   ├── home/
│   └── discover/
├── journey/
│   ├── results/
│   ├── booking/
│   ├── review/
│   ├── payment/
│   ├── tracker/
│   └── ticket/
├── components/
│   ├── nira/
│   ├── journey/
│   ├── train/
│   ├── payment/
│   └── accessibility/
├── lib/
│   ├── api/
│   ├── state/
│   └── validation/
└── types/
Next.js + React + TypeScript.
Tailwind CSS and shadcn/ui for consistent UI primitives.
Framer Motion for restrained transitions and guided focus effects.
Client state should contain presentation state; authoritative journey state comes from the backend.
Nira is a floating contextual overlay, not a separate full-page chatbot.
# 6. Nira AI Architecture
Nira has three distinct responsibilities: understand, explain and assist. It does not become an unrestricted autonomous browser agent.
USER SPEECH / TEXT
       │
       ▼
  STT / NORMALIZATION
       │
       ▼
┌───────────────────────┐
│ NIRA INTENT SERVICE   │
│ NVIDIA NIM / API      │
└──────────┬────────────┘
           │ structured JSON
           ▼
┌───────────────────────┐
│ SCHEMA VALIDATOR      │
│ required fields       │
│ types / enums         │
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ ACTION ALLOWLIST      │
│ search_train          │
│ filter_results        │
│ focus_element         │
│ prepare_autofill      │
│ explain_payment       │
│ check_payment_status  │
└──────────┬────────────┘
           ▼
 DETERMINISTIC SERVICE
           │
           ▼
        UI RESULT
## 6.1 Structured AI Contract
{
  "intent": "SEARCH_TRAIN",
  "entities": {
    "origin": "Delhi",
    "destination": "Mumbai",
    "date": "synthetic-date",
    "passengers": 2
  },
  "confidence": 0.94,
  "requested_action": "search_train"
}
The exact production schema may evolve, but the architectural rule remains fixed: the LLM returns structured intent; application code decides what can actually execute.
## 6.2 Separate Safe-Assistance Mode
For simple navigation and first-level assistance, Nirantar may use a deterministic keyword/intent matching mode. This provides a lower-risk fallback and reduces unnecessary LLM calls.

# 7. Data & Storage Architecture
                     ┌───────────────────┐
                     │    PostgreSQL      │
                     │ users / journeys   │
                     │ trains / bookings  │
                     │ AI action audit    │
                     └─────────┬─────────┘
                               │
                     ┌─────────▼─────────┐
                     │       Redis       │
                     │ session / cache   │
                     │ short-lived state │
                     └───────────────────┘

# 8. Scrapling Data Ingestion Architecture
Scrapling is used only for permitted public, non-sensitive web information. It is an ingestion utility, not a mechanism for bypassing authentication, anti-bot controls or private systems.
Permitted public source
        │
        ▼
    Scrapling
        │
        ▼
Parser / Normalizer
        │
        ▼
Schema validation
        │
        ▼
Deduplication / freshness
        │
        ▼
PostgreSQL train dataset
        │
        ▼
Train Service / UI
Never scrape authenticated user pages.
Never collect personal or restricted information.
Normalize source data before it reaches recommendation logic.
Keep source timestamps so stale data can be identified.
If scraping is unavailable, the prototype falls back to synthetic fixtures.
# 9. Train Recommendation Architecture
Journey Intent
     │
     ▼
Train Search
     │
     ├── filters
     ├── availability
     ├── schedule
     └── fare
     │
     ▼
Candidate Set
     │
     ▼
Deterministic Ranking
     │
     ├── Best overall
     ├── Cheapest
     └── Fastest
     │
     ▼
Explainable Result
     │
     ▼
Nira / UI
The LLM may explain a structured result in friendly language, but it must not invent train numbers, fares, availability or timings.
# 10. Continuous Booking Architecture
DISCOVER
   ↓
SEARCH
   ↓
SELECT TRAIN
   ↓
PASSENGER DETAILS
   ↓
SAFE AUTOFILL
   ↓
REVIEW
   ↓
PAYMENT
   ↓
PAYMENT STATE
   ├── SUCCESS → BOOKING CONFIRMED
   ├── FAILED  → RETRY / CHANGE METHOD
   └── UNKNOWN → VERIFY STATUS → RESOLVE
                         ↓
                    NO BLIND RETRY
                         ↓
                    TRACK JOURNEY
# 11. Payment State Machine

## 11.1 Critical Payment Safety Rule
When state is UNKNOWN, Nirantar must not encourage a second payment attempt. The user is shown a clear status-verification path first. This directly addresses one of the highest-friction and highest-risk parts of digital public-service journeys.
# 12. Safe Autofill Architecture
Profile / synthetic passenger data
             │
             ▼
      Field Allowlist
             │
             ▼
       Autofill Plan
             │
             ▼
     User Confirmation
             │
       ┌─────┴─────┐
       │           │
      YES          NO
       │           │
       ▼           ▼
 Apply fields    Cancel


# 13. Fair Access Guard + PortalPulse
Nirantar's fairness mechanism is deliberately separated from the AI assistant. PortalPulse observes synthetic infrastructure signals; Fair Access Guard turns those signals into proportionate system-level behavior.
Traffic / telemetry
       │
       ▼
PortalPulse
       │
       ├── anomaly score
       ├── predicted load
       ├── latency trend
       └── concurrency trend
       │
       ▼
Fair Access Policy Engine
       │
       ├── normal
       ├── soft rate limit
       ├── verification
       └── queue
       │
       ▼
Citizen-facing status
Important: high traffic is not equivalent to malicious identity. The prototype must avoid labeling citizens as scammers or attackers based solely on behavioral telemetry.
# 14. API Layer

# 15. Security Architecture
TLS/HTTPS for all client-server communication.
Environment variables or secret management for NVIDIA API credentials.
Server-side LLM calls only.
Strict request/response schemas.
Allowlist-based action execution.
Input validation and output sanitization.
No secrets in prompts, logs or analytics.
Rate limiting on AI and public endpoints.
Session identifiers are separated from LLM context.
Synthetic credentials only in the hackathon environment.
# 16. Authentication, Identity & Session Architecture
Authentication is treated as a separate security boundary from Nira. Nirantar may demonstrate a mock citizen account and a mock railway-account authentication flow, but the LLM never receives passwords, OTPs, session cookies, access tokens or other authentication secrets.
## 16.1 Authentication Flow
Citizen
  │
  ▼
Login / Account Selection
  │
  ├── Mock account credentials
  │
  ▼
Authentication Service
  │
  ├── credential verification
  ├── session creation
  └── risk / rate checks
  │
  ▼
Short-lived Session
  │
  ▼
Nirantar Journey
  │
  └── Nira receives only non-sensitive session context
## 16.2 Authentication Rules
## 16.3 Mock Authentication Sequence
1. User selects "Sign in".
2. Secure mock-auth component opens.
3. User enters synthetic credentials directly into the secure UI.
4. Auth Service validates the credentials.
5. Auth Service creates a session.
6. Journey Service associates the session with the current journey.
7. Nira receives only allowed context such as:
   - authenticated = true
   - current journey ID
   - current page
   - permitted profile attributes
8. Sensitive authentication values are discarded from application-level AI context.
# 17. Banking / Payment Guidance Architecture
The banking concept is implemented as a guided payment experience, not as an AI-controlled banking session. Nirantar can demonstrate the user's preferred payment route, explain banking options, highlight the exact next control and return to the same booking journey without exposing banking credentials to Nira.
## 17.1 Banking Guidance Model
Nirantar Payment
      │
      ▼
Payment Method Selection
      │
      ├── UPI
      ├── Card
      ├── Net Banking
      └── Other permitted mock method
      │
      ▼
Safe Payment Handoff / Mock Bank View
      │
      ▼
Banking Guidance Layer
      │
      ├── "Choose your bank"
      ├── "Select this option"
      ├── "Return to payment"
      └── "Check payment status"
      │
      ▼
Payment Provider / Mock Bank
      │
      ▼
Payment State Machine
      │
      ├── SUCCESS
      ├── FAILED
      └── UNKNOWN
      │
      ▼
Nirantar Journey Continues
## 17.2 One-Tab / Continuous Journey Principle
The prototype should visually preserve a single continuous Nirantar journey. If a real integration would require a bank or payment-provider handoff, the architecture represents that boundary explicitly while the demo can keep the interaction inside a controlled mock environment. Nirantar must never claim that it can bypass a bank's security redirect or authentication boundary.
## 17.3 Banking Option Guidance
## 17.4 Banking Security Boundary
## 17.5 Payment Redirect / Return Architecture
                     NIRANTAR
                         │
                  Create Payment
                         │
                         ▼
                Payment Provider
                         │
                ┌────────┴────────┐
                │                 │
          Secure Auth        Payment UI
                │                 │
                └────────┬────────┘
                         │
                  Provider Result
                         │
                  callback/status
                         ▼
                 Payment Service
                         │
                         ▼
              Journey State Machine
                         │
                         ▼
                Nirantar Tracker
## 17.6 Preventing Payment Duplication
Every payment attempt receives a unique synthetic transaction ID and an idempotency key. If the browser returns without a definitive result, Nirantar checks the transaction state before allowing another payment attempt.
# 18. Updated End-to-End Security Architecture
                         CITIZEN
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          NIRANTAR UI              SECURE UI
                 │                Auth / Payment
                 ▼                     │
            NIRA AI                    │
          NVIDIA NIM                   │
                 │                     │
       structured intent               │
                 │                     │
                 ▼                     ▼
          ACTION VALIDATOR       AUTH / PAYMENT
                 │                     SERVICES
                 └──────────┬──────────┘
                            ▼
                    JOURNEY SERVICES
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
               Train     Booking    Payment
                                       │
                                       ▼
                                State Machine
                                       │
                                       ▼
                                  Tracker/Ticket

Security rule:
AI context ≠ credential context ≠ payment-secret context.
## 18.1 Updated Trust Boundaries
## 18.2 Expanded Architecture Decision
Authentication and banking are deliberately not hidden inside the chatbot. This makes Nirantar's architecture more credible: AI handles language and guidance, while authentication, banking and payment remain secure, deterministic boundaries. In a future authorized deployment, those boundaries could connect to official identity and payment providers without giving the LLM direct access to their secrets.
# 19. Failure Handling

# 20. Deployment Architecture
                 INTERNET
                    │
              ┌─────▼─────┐
              │ Web / CDN │
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │ Next.js   │
              └─────┬─────┘
                    │ HTTPS
              ┌─────▼─────┐
              │ FastAPI   │
              └──┬───┬────┘
                 │   │
        ┌────────┘   └────────┐
        ▼                     ▼
   PostgreSQL              Redis
        │
        ├──────────────► NVIDIA API/NIM
        │
        └──────────────► Telemetry / PortalPulse
For the hackathon, this can be deployed as a small number of services. The architecture is modular conceptually; it does not require premature microservice deployment.
# 21. Observability

# 22. End-to-End Sequence
1. User says: "I need to go from Delhi to Mumbai tomorrow evening."
2. STT/text normalization creates input.
3. Nira extracts structured intent.
4. User confirms the extracted journey.
5. Train Service searches structured data.
6. Ranking engine returns candidate trains.
7. UI shows comparison and Nira explains the recommendation.
8. User selects a train.
9. Journey Service creates booking state.
10. Safe Autofill prepares only approved fields.
11. User reviews and confirms.
12. Payment state machine starts mock payment.
13. If SUCCESS → booking confirmed.
14. If UNKNOWN → status verification; no blind second payment.
15. Journey Tracker updates.
16. Synthetic ticket is displayed.
17. PortalPulse/Fair Access operates in parallel when demand becomes abnormal.
# 23. Architecture Decision Records

# 24. Build Order
Build frontend shell and continuous journey state.
Implement train dataset + deterministic search/filter/ranking.
Implement Discover + Nira structured intent.
Implement guided navigation and visual focus actions.
Implement safe autofill with allowlisted fields.
Implement booking state and mock payment state machine.
Implement tracker and completion ticket.
Add Nira contextual overlay and keyword fallback.
Add telemetry and Fair Access Guard.
Connect PortalPulse signals.
Add Scrapling ingestion where legally/permissibly applicable.
Run security tests, failure-state tests and full reviewer journey.
# 25. Architecture Success Criteria
Every citizen-facing feature has a deterministic backend owner.
No LLM response can directly invoke arbitrary application code.
No sensitive credential or payment secret reaches the LLM.
A reviewer can complete the full simulated railway journey in one continuous flow.
Payment UNKNOWN is handled safely and visibly.
Train recommendations are reproducible from structured data.
AI failure does not break the core journey.
Fair Access behavior is proportionate and does not equate traffic behavior with identity.
PortalPulse adds a meaningful infrastructure layer without becoming the product itself.
The architecture can later replace synthetic services with authorized integrations without redesigning the citizen UX.
# Appendix A — Core Architecture in One View
                         NIRANTAR
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
     CITIZEN UX                          INTELLIGENCE
          │                                   │
  ┌───────┼────────┐                   ┌──────┴──────┐
  │       │        │                   │             │
Nira   Journey   Payment            PortalPulse   Telemetry
  │       │        │                   │             │
  └───────┼────────┘                   └──────┬──────┘
          │                                   │
          ▼                                   ▼
    SAFE ACTION LAYER ←──────────── FAIR ACCESS GUARD
          │
          ▼
 DETERMINISTIC DOMAIN SERVICES
  ├── Train
  ├── Booking
  ├── Autofill
  ├── Payment
  └── Tracker
          │
          ▼
 PostgreSQL + Redis + permitted/synthetic data

LLM boundary:
NVIDIA NIM/API → structured intent/explanation ONLY
Sensitive credentials/payment secrets → NEVER enter LLM context.
# Appendix B — Architecture Positioning
The technical differentiator of Nirantar is not simply 'using an LLM'. The architecture combines a citizen-first continuous workflow, deterministic domain logic, a bounded AI action layer, explicit payment recovery, safe autofill, public-data ingestion, and PortalPulse-backed fair-access intelligence. This creates a defensible separation between what AI is good at—language, intent and explanation—and what software must control—facts, money, credentials, state and consequential actions.
Authentication must be handled by a dedicated auth boundary, not by the LLM.
Passwords are verified by the authentication service and are never sent to NVIDIA NIM.
OTP flows are simulated with synthetic values in the hackathon prototype.
Session tokens/cookies remain in the application security layer and are never inserted into prompts.
Nira can tell the user where to authenticate and can guide them through the UI, but cannot request or store their password/OTP.
Repeated failed authentication attempts may trigger synthetic rate limiting or temporary lockout behavior.
The UI should clearly distinguish 'Nira is guiding you' from 'the secure authentication component is handling your credentials.'
The user should not lose their booking context during payment.
The payment surface should clearly identify whether it is Nirantar, a payment provider, or a bank-style mock surface.
Return-to-journey state is maintained by a server-side journey ID rather than browser-only state.
A payment callback/webhook would be the authoritative mechanism in a future authorized production integration.
For the prototype, payment outcomes are synthetic and driven by a mock provider.
Nira may explain the difference between available payment methods.
Nira may guide the user to the exact bank/payment option using a visual focus or arrow.
Nira may compare user-visible options using deterministic metadata such as supported method or estimated flow length.
Nira must not recommend a bank based on fabricated claims, hidden commissions or unsupported security assertions.
Nira must not ask the user to paste banking credentials, OTPs, PINs or card security values into chat.

SUCCESS → do not create another payment.
FAILED → a new attempt may be created after user confirmation.
UNKNOWN → verify existing transaction first.
PROCESSING → show pending state and poll/check status rather than starting another transaction.
This logic is deterministic and never delegated to Nira.

| Field | Value |
| Architecture Style | Modular service-oriented web application |
| Primary Interface | Responsive web UI + contextual Nira overlay |
| LLM | NVIDIA API / NVIDIA NIM |
| Backend | Python + FastAPI |
| Data | PostgreSQL + Redis + synthetic datasets |
| Web ingestion | Scrapling for permitted public, non-sensitive sources |
| Infrastructure intelligence | PortalPulse telemetry / prediction layer |
| Critical principle | LLM is advisory; deterministic services control facts and consequential actions. |
| Principle | Implementation Rule |
| AI is not the source of truth | Train inventory, fares, booking state and payment state come from structured services. |
| Least privilege | Each service receives only the data required for its function. |
| Sensitive-data isolation | Passwords, OTPs, UPI PINs, CVVs, full card data and auth tokens never enter LLM context. |
| Deterministic execution | LLM output becomes a validated action object before any application action. |
| Human-in-the-loop | Consequential actions require explicit user interaction. |
| State continuity | Journey state is maintained server-side so page transitions do not fragment the task. |
| Safe degradation | If AI fails, deterministic search/navigation remains usable. |
| Prototype honesty | Mock accounts, booking, payment and inventory are clearly labelled. |
| ID | Component | Responsibility |
| C1 | Web Client | Pages, journey state display, forms, Nira overlay, accessibility. |
| C2 | Nira AI Gateway | LLM orchestration, prompt construction, structured output and safety filtering. |
| C3 | Intent Service | Converts natural language/STT output into validated journey intent. |
| C4 | Action Validator | Checks AI-generated actions against a strict schema and allowlist. |
| C5 | Train Service | Searches, filters, ranks and explains structured train data. |
| C6 | Journey Service | Owns journey state and booking workflow. |
| C7 | Autofill Service | Prepares only approved low-risk fields for user confirmation. |
| C8 | Payment State Machine | Models payment lifecycle and recovery from uncertain outcomes. |
| C9 | Fair Access Guard | Uses traffic signals to apply proportionate queue/rate/verification behavior. |
| C10 | Telemetry Service | Collects synthetic application and infrastructure metrics. |
| C11 | PortalPulse | Predictive infrastructure intelligence and anomaly signals. |
| C12 | Data Layer | PostgreSQL, Redis and structured synthetic/public data. |
| Mode | Use | LLM Required? |
| Keyword / Rule Mode | Known navigation phrases, page lookup, help topics, fixed actions. | No |
| Structured AI Mode | Natural-language travel intent, clarification, explanations. | Yes |
| Sensitive Action Mode | Payment/authentication/credential operations. | No direct LLM execution |
| Data | Store | Notes |
| Journey state | PostgreSQL + Redis | Redis for active state; PostgreSQL for durable prototype state. |
| Train dataset | PostgreSQL | Structured mock/permitted public information. |
| Payment state | PostgreSQL | Synthetic transaction state machine. |
| AI action log | PostgreSQL | No secret values. |
| Session context | Redis | Short-lived, minimal context. |
| Telemetry | PostgreSQL/time-series-compatible layer | Synthetic demo telemetry. |
| State | Meaning | Allowed Next States |
| READY | No payment started. | INITIATED |
| INITIATED | Payment request created. | PROCESSING / FAILED |
| PROCESSING | Provider result pending. | SUCCESS / FAILED / UNKNOWN |
| SUCCESS | Payment confirmed. | BOOKING_CONFIRMED |
| FAILED | Payment failed. | INITIATED / READY |
| UNKNOWN | Outcome cannot yet be trusted. | VERIFYING |
| VERIFYING | Status being checked. | SUCCESS / FAILED / UNKNOWN |
| BOOKING_CONFIRMED | Journey successfully booked. | TRACKING |
| Allowed for Prototype Autofill | Never sent to LLM |
| Name / age / gender in synthetic demo data | Password |
| Journey preferences | OTP |
| Non-sensitive contact placeholder | UPI PIN |
| Seat/class preference | CVV / full card number |
| Synthetic passenger identifiers | Session cookies / access tokens |
| Endpoint Group | Example Responsibility |
| POST /api/nira/intent | Convert user request to structured intent. |
| POST /api/nira/action | Validate and execute an allowlisted safe action. |
| GET /api/trains | Search/filter train dataset. |
| GET /api/trains/{id} | Return train details. |
| POST /api/journeys | Create journey. |
| GET /api/journeys/{id} | Return current journey state. |
| POST /api/journeys/{id}/autofill/prepare | Prepare safe autofill plan. |
| POST /api/journeys/{id}/autofill/apply | Apply confirmed safe fields. |
| POST /api/payments | Start synthetic payment. |
| GET /api/payments/{id}/status | Check payment state. |
| POST /api/payments/{id}/verify | Resolve UNKNOWN state. |
| GET /api/telemetry | Return synthetic system signals for internal/demo use. |
| Failure | System Behavior |
| NVIDIA API unavailable | Fallback to keyword/rule mode and deterministic UI actions. |
| STT unavailable | Show text input immediately. |
| Train source unavailable | Use cached/synthetic dataset with clear freshness label. |
| Payment timeout | Move to UNKNOWN; verify status instead of retrying. |
| Redis unavailable | Use durable journey state where possible; degrade gracefully. |
| PortalPulse unavailable | Fair Access Guard uses conservative static thresholds. |
| Invalid AI action | Reject action and show safe fallback. |
| Ambiguous user intent | Ask a clarification question instead of guessing. |
| Signal | Purpose |
| Request rate | Detect load spikes. |
| Concurrent sessions | Estimate active demand. |
| Latency | Detect degradation. |
| Error rate | Detect service instability. |
| AI action rejection rate | Detect unsafe/invalid AI outputs. |
| Payment UNKNOWN count | Detect payment ambiguity. |
| Queue depth | Understand fair-access pressure. |
| Train-source freshness | Prevent stale-data confusion. |
| Decision | Reason |
| NVIDIA NIM/API behind backend | Prevents API-key exposure and centralizes prompt/security policy. |
| LLM → JSON → validator → action | Prevents arbitrary AI-generated execution. |
| Deterministic train ranking | Prevents hallucinated inventory and makes recommendations reproducible. |
| Payment as explicit state machine | Makes ambiguous payment outcomes safe and testable. |
| Nira as overlay | Preserves focus on the citizen task instead of replacing the entire interface. |
| PortalPulse behind Fair Access Guard | Shows infrastructure intelligence without turning the citizen experience into an admin dashboard. |
| Scrapling behind ingestion boundary | Separates source collection from product logic and allows synthetic fallback. |
| Modular monolith for prototype | Faster hackathon delivery while preserving clear service boundaries. |
| Data / Action | Nira Access | Secure Payment/Auth Layer |
| Bank name selected | Allowed | Allowed |
| Payment method | Allowed | Allowed |
| Transaction reference | Masked / non-secret | Allowed |
| Payment status | Allowed | Authoritative |
| Account username | No | Yes, only where required by mock/provider |
| Password | Never | Yes, only in secure auth component |
| OTP | Never | Yes, only in secure auth component |
| UPI PIN | Never | Yes, only in secure payment component |
| CVV / full card data | Never | Yes, only in secure payment component |
| Session/access token | Never | Security infrastructure only |
| Boundary | What Crosses It | What Must Not Cross It |
| Browser → Nira | Intent, page context, approved profile attributes | Passwords, OTPs, PINs, CVV, tokens |
| Nira → Backend | Structured intent/action request | Arbitrary executable code |
| Backend → Train Service | Search parameters | Credentials |
| Backend → Payment Service | Transaction metadata | LLM-generated payment commands |
| Payment → Journey | Verified status/reference | Raw card/UPI secret |
| PortalPulse → Fair Access | Aggregated telemetry/signals | Personal identity judgments |