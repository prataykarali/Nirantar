NIRANTAR
DEVELOPMENT SPECIFICATION
Engineering Plan • v1.0


# 1. Development Objective
Build a working citizen journey rather than a collection of screens. The engineering target is a demonstrable IRCTC-focused prototype where a user can search, compare, prepare booking details, authenticate through a mock secure surface, select a payment method, experience payment success/failure/unknown states, and return to a tracker without losing journey context.
Engineering rule: AI interprets; deterministic services validate and execute.
# 2. Scope & Non-Scope

# 3. Technology Stack

# 4. Repository Structure
nirantar/
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.tsx             # Home
│   │   │   ├── discover/
│   │   │   ├── trains/
│   │   │   ├── booking/
│   │   │   ├── payment/
│   │   │   ├── tracker/
│   │   │   └── ticket/
│   │   ├── components/
│   │   │   ├── nira/
│   │   │   ├── journey/
│   │   │   ├── trains/
│   │   │   ├── payment/
│   │   │   └── ui/
│   │   ├── lib/
│   │   └── tests/
│   │
│   └── api/                         # FastAPI backend
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   │   ├── auth/
│       │   │   ├── nira/
│       │   │   ├── trains/
│       │   │   ├── booking/
│       │   │   ├── payment/
│       │   │   ├── tracker/
│       │   │   └── fairness/
│       │   └── main.py
│       └── tests/
│
├── data/
│   ├── synthetic/
│   ├── normalized/
│   └── fixtures/
│
├── ingestion/
│   └── scrapling/
│
├── infra/
│   ├── docker/
│   └── db/
│
├── docs/
└── README.md
# 5. Core Domain Model

# 6. Journey State Machine
DISCOVER
   ↓
SEARCHED
   ↓
TRAIN_SELECTED
   ↓
PASSENGER_REVIEW
   ↓
AUTH_REQUIRED ──→ AUTHENTICATED
   ↓
PAYMENT_READY
   ↓
PAYMENT_PROCESSING
   ├──→ SUCCESS ──→ TICKET_ISSUED
   ├──→ FAILED ──→ PAYMENT_READY
   └──→ UNKNOWN ──→ VERIFY_PAYMENT
                         ├──→ SUCCESS
                         └──→ FAILED / RETRY

Invariant:
UNKNOWN must never automatically create a second payment attempt.
# 7. Frontend Development
## 7.1 Page Implementation

## 7.2 Frontend State Strategy
Server state: TanStack Query or equivalent for API data and cache.
Journey state: a single typed journey context/store keyed by journey_id.
UI state: local component state for panels, filters and animation.
Never store payment secrets or authentication secrets in client-side AI state.
Persist only safe draft fields necessary to resume the journey.
Use optimistic updates only for reversible UI actions, not payment state.
# 8. Nira Development
## 8.1 AI Pipeline
USER TEXT / STT
      ↓
NORMALIZER
      ↓
NIRA LLM (NVIDIA API)
      ↓
STRICT JSON OUTPUT
      ↓
SCHEMA VALIDATOR
      ↓
POLICY / ACTION ALLOWLIST
      ↓
DETERMINISTIC SERVICE
      ↓
RESULT
      ↓
NIRA EXPLANATION + UI GUIDANCE
## 8.2 Nira Output Contract
{
  "intent": "search_train",
  "entities": {
    "origin": "Delhi",
    "destination": "Mumbai",
    "date": "2026-09-01"
  },
  "confidence": 0.94,
  "needs_clarification": false,
  "suggested_action": "SEARCH_TRAINS"
}
The production contract should use enums and schema validation. Free-form model output must never directly call a payment, authentication or booking function.
## 8.3 Safe Assist / Keyword Mode
Provide a deterministic mode that uses keyword/entity matching for basic intents such as search, track, help and navigation.
Use it as the fallback when the NVIDIA endpoint is unavailable or when the request does not require generative reasoning.
This mode improves predictability and gives the demo a reliable offline/degraded path.
Example: 'track my train' → TRACK intent; 'Delhi to Mumbai tomorrow' → SEARCH intent if required fields can be extracted deterministically.
## 8.4 AI Prompting Rules
System prompt defines role, supported intents and security boundaries.
The model receives only minimum necessary context.
Sensitive fields are redacted before any AI request.
The model cannot invent availability, fares, payment results or official government claims.
For uncertainty, the model must ask for clarification.
All consequential actions require backend validation.
# 9. STT Development
Capture microphone input only after explicit user action.
Convert speech to text in the client/provider layer.
Show the transcript before using it for a consequential action.
Normalize common Indian travel phrases and date expressions.
Allow manual correction.
Do not store raw audio unless explicitly required by the prototype and clearly disclosed.
# 10. Safe Autofill Development
User-approved profile/draft data
          ↓
Allowed-field mapper
          ↓
Validation
          ↓
Form field population
          ↓
User review
          ↓
Submit

AI NEVER RECEIVES:
password / OTP / UPI PIN / CVV / access token / session cookie
Only allowlisted fields can be autofilled.
Autofill should be reversible.
The review screen must identify fields prepared automatically.
Sensitive authentication/payment fields remain in secure UI components.
# 11. Train Discovery & Comparison
Seed the prototype with synthetic train schedules and fares.
Normalize scraped public informational content into a controlled schema.
Search uses deterministic filtering and sorting.
Recommendation labels are computed from explicit criteria: price, duration, departure fit and availability.
Nira may explain the deterministic recommendation but must not fabricate reasons.
All displayed availability should be marked as mock/synthetic when not live.
# 12. Scrapling Ingestion Pipeline
Permitted public source
        ↓
Scrapling fetch/extract
        ↓
Raw snapshot
        ↓
Parser / selector
        ↓
Normalizer
        ↓
Validation
        ↓
Synthetic/internal dataset
        ↓
Application API

Do not scrape:
private systems
personal information
restricted data
undocumented private APIs
Keep ingestion code separate from application code.
Store source URL and captured_at metadata.
Validate schema before data enters the application.
Use synthetic fixtures for the actual demo so the prototype does not depend on a live government system.
Respect source terms, access controls and robots/policies where applicable.
# 13. Authentication Development
Login UI
  ↓
Auth API
  ↓
Credential verification
  ↓
Session creation
  ↓
Journey session
  ↓
Safe user context

Nira receives:
authenticated=true
safe profile context

Nira does NOT receive:
password / OTP / session token
Use synthetic accounts for the hackathon.
Passwords must be hashed if stored at all.
Use short-lived sessions and secure cookies in a production-like implementation.
Implement mock OTP verification entirely with synthetic values.
On session expiry, preserve the journey_id and return the user to the same step after re-authentication.
# 14. Banking & Payment Development
## 14.1 Payment Architecture
Nirantar
  ↓
Create PaymentAttempt
  ↓
Mock Payment Provider
  ↓
Mock Bank/Auth Surface
  ↓
Payment Result
  ↓
Payment State Machine
  ↓
Journey / Ticket
## 14.2 Payment API Contract

## 14.3 Payment Security Rules
Never send payment credentials to NVIDIA.
Never store CVV/UPI PIN/OTP in application logs.
Use idempotency keys on payment creation.
A successful payment is immutable.
UNKNOWN must trigger verification before retry.
The mock provider is clearly labelled as a prototype component.
# 15. Backend API Design

# 16. Database & Persistence
Use PostgreSQL as the source of truth for persistent prototype entities.
Use Redis for short-lived session/journey state and rate limiting.
Use database transactions around booking/payment state changes.
Use unique constraints for booking/payment references and idempotency keys.
Seed deterministic synthetic data so every demo run can be reproduced.
# 17. PortalPulse-Inspired Fair Access Layer
Nirantar may include a lightweight demonstration of fair-access behavior inspired by the PortalPulse project, but it must remain an aggregate service-protection mechanism rather than an identity-based ranking system.
Aggregated telemetry
      ↓
Load / latency / error estimator
      ↓
Capacity state
      ↓
Fair Access Controller
      ├── NORMAL
      ├── BUSY
      ├── QUEUED
      └── DEGRADED
      ↓
Citizen-facing message
      ↓
Preserve journey context
Use synthetic traffic and telemetry.
Do not use sensitive personal attributes to prioritize citizens.
Prefer transparent queue rules.
Explain waiting states in plain language.
Never claim that the prototype is protecting a real government system.
# 18. Security Architecture

# 19. Error Handling

# 20. Testing Strategy

# 21. End-to-End Acceptance Tests
User starts a journey using typed or voice input.
Nirantar shows the interpreted request and allows correction.
Synthetic trains are returned and compared.
User selects a train.
Passenger information is prepared only from safe allowed fields.
User reviews and confirms details.
Mock authentication succeeds.
User selects a payment method.
Payment SUCCESS results in a ticket.
Payment FAILED offers a retry.
Payment UNKNOWN forces status verification before another attempt.
User can open Tracker and see the same journey state.
AI outage does not prevent manual completion.
Sensitive values never appear in AI requests or logs.
# 22. Development Phases

# 23. Definition of Done
The complete citizen journey works without manual developer intervention.
All core pages are responsive.
Nira can interpret supported intents and falls back safely.
AI outputs are schema-validated and action-allowlisted.
Authentication and payment secrets never enter AI context.
Payment state transitions are deterministic and tested.
UNKNOWN payment cannot be blindly retried.
Synthetic/mock data is clearly disclosed.
No live government system is accessed or interfered with.
The prototype has a repeatable demo dataset.
Core journey passes end-to-end tests.
# 24. Deployment
                 DEMO USER
                     │
                     ▼
              Next.js Web App
                     │
                  HTTPS
                     │
                     ▼
                FastAPI API
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      PostgreSQL   Redis    NVIDIA API
          │          │
          └────┬─────┘
               ▼
        Synthetic Services
       ┌───────┼────────┐
       ▼       ▼        ▼
     Trains  Payment   Tracker
       │       │
       └───────┴──────────→ Demo Journey
# 25. Demo Configuration

# 26. Environment Variables
DATABASE_URL=
REDIS_URL=
NVIDIA_API_KEY=
NVIDIA_MODEL=
NEXT_PUBLIC_API_BASE_URL=
SESSION_SECRET=
ENABLE_DEMO_MODE=true
ENABLE_MOCK_AUTH=true
ENABLE_MOCK_PAYMENTS=true
SCRAPLING_USER_AGENT=

Secrets belong in the deployment secret manager/environment, never in source control.
# 27. Engineering Risks & Mitigations

# 28. Implementation Priority
P0 — Must work: Home → search → train selection → booking → payment → ticket/tracker.
P1 — Differentiator: Nira contextual guidance, STT, safe autofill, payment recovery and one-journey UX.
P2 — Intelligence: Scrapling ingestion, richer recommendations, PortalPulse fair-access simulation.
P3 — Polish: 3D animation, accessibility refinement, performance, analytics and demo instrumentation.
# 29. Final Development Architecture
                         NIRANTAR WEB
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
          Journey UI        Nira UI          Secure UI
                              │             Auth / Payment
                              ▼                │
                         NVIDIA API            │
                              │                │
                              ▼                │
                      JSON + Schema             │
                              │                │
                              ▼                │
                        Action Policy           │
                              │                │
             ┌────────────────┼────────────────┘
             ▼                ▼
        Deterministic     Secure Services
          Services       ┌──────┬──────┐
       ┌────┼────┐       Auth  Payment Ticket
       ▼    ▼    ▼
    Trains Booking Tracker
             │
             ▼
       PostgreSQL / Redis
             │
             ▼
      Telemetry / Fair Access
             │
             ▼
       Citizen-facing UX
# 30. Final Engineering Principle
Nira understands the citizen. Nirantar controls the journey. Secure services control the secrets.
| Field | Decision |
| Product | Nirantar — citizen-first IRCTC journey assistant |
| Prototype scope | Complete synthetic/mock railway journey from discovery to ticket/payment result |
| Primary stack | Next.js/React + TypeScript + Tailwind + shadcn/ui; FastAPI + Python |
| AI | NVIDIA API/NIM-compatible LLM + deterministic intent/action validation |
| STT | Browser speech recognition where supported, with server/provider fallback |
| Data | PostgreSQL + Redis; synthetic/mock railway and payment data |
| Scraping | Scrapling for permitted public informational pages; normalized into internal datasets |
| Observability | Structured logs + application metrics + PortalPulse-style telemetry |
| Security | Credential/payment secrets isolated from AI context |
| In Scope | Out of Scope |
| Synthetic railway search and availability | Accessing/interfering with live IRCTC systems |
| Mock citizen account/authentication | Real passwords, OTPs or credentials |
| Safe synthetic autofill | Sending sensitive credentials to an LLM |
| Mock payment provider/bank journey | Real banking/payment execution |
| Payment state machine | Bypassing bank/provider authentication |
| Scrapling-based permitted informational ingestion | Scraping restricted/private/personal data |
| Nira contextual assistance | Uncontrolled agentic browser automation |
| PortalPulse-inspired aggregated traffic/fair-access simulation | Real DDoS/load testing against government infrastructure |
| Layer | Technology | Responsibility |
| Web | Next.js + React + TypeScript | Pages, components, journey state and responsive UI |
| Styling | Tailwind CSS + shadcn/ui | Design system and accessible primitives |
| Animation | Framer Motion | Nira overlay, transitions, guided focus and 3D presentation motion |
| 3D | React Three Fiber / lightweight 3D assets | Nira/hero visual layer where performance permits |
| API | FastAPI + Pydantic | Typed backend contracts and orchestration |
| AI | NVIDIA API / NIM-compatible endpoint | Natural-language interpretation and explanations |
| STT | Web Speech API + provider fallback | Voice-to-text input |
| Database | PostgreSQL | Users, journeys, synthetic trains, bookings and payment records |
| Cache | Redis | Session/journey state, rate limits, short-lived search cache |
| Scraping | Scrapling | Permitted public informational ingestion |
| Validation | Pydantic + JSON Schema | Strict AI output validation |
| Testing | Pytest + Playwright + Vitest | Backend, frontend and end-to-end tests |
| Containerization | Docker | Reproducible local/demo deployment |
| Entity | Important Fields |
| User | id, display_name, preferences, created_at |
| Session | id, user_id, expires_at, auth_state |
| Journey | id, user_id, origin, destination, date, passengers, current_step, status |
| Train | id, number, name, origin, destination, departure, arrival, duration |
| Availability | train_id, class_code, seats, fare, captured_at |
| PassengerDraft | journey_id, synthetic passenger fields, validation_state |
| PaymentAttempt | id, journey_id, amount, method, state, idempotency_key |
| Ticket | id, journey_id, booking_reference, status |
| NiraEvent | id, journey_id, intent, action, validation_result, timestamp |
| TelemetryEvent | timestamp, route, latency, load bucket, error bucket |
| Page | Primary Components | Backend Dependency |
| Home | JourneySearch, RecentJourneys, NiraBubble | Journey API |
| Discover | VoiceInput, IntentPreview, EditIntent | Nira/Intent API |
| Trains | TrainCard, Filters, Recommendation | Train Search API |
| Booking | PassengerForm, ProgressStepper, NiraGuide | Journey + Auth |
| Review | AutofillReview, ValidationSummary | Autofill/Validation API |
| Payment | PaymentMethodCard, PaymentState | Payment API |
| Tracker | StatusTimeline, JourneySummary | Journey API |
| Ticket | TicketCard, CompletionActions | Ticket API |
| Endpoint | Purpose |
| POST /payments | Create a synthetic payment attempt |
| GET /payments/{id} | Read authoritative payment state |
| POST /payments/{id}/verify | Verify UNKNOWN/PROCESSING state |
| POST /payments/{id}/retry | Create a new attempt only after failed state |
| POST /payments/{id}/mock-result | Demo-only deterministic test transition |
| Area | Example Routes |
| Auth | /auth/login, /auth/logout, /auth/session |
| Journey | /journeys, /journeys/{id}, /journeys/{id}/resume |
| Nira | /nira/interpret, /nira/assist |
| Trains | /trains/search, /trains/{id} |
| Booking | /journeys/{id}/passengers, /journeys/{id}/review |
| Payment | /payments, /payments/{id}, /payments/{id}/verify |
| Ticket | /journeys/{id}/ticket |
| Tracker | /journeys/{id}/status |
| Telemetry | /telemetry/events |
| Layer | Controls |
| Frontend | CSP, secure headers, input validation, no secrets in local storage |
| API | Authentication, authorization, rate limiting, Pydantic validation |
| AI | Redaction, schema validation, allowlisted actions, minimal context |
| Database | Parameterized queries/ORM, least privilege, encrypted transport |
| Payment | Isolated state machine, idempotency, secret isolation |
| Logging | Redaction of credentials, tokens, OTPs and payment secrets |
| Scraping | Permitted public sources only; no restricted/personal data |
| Failure | Fallback |
| NVIDIA unavailable | Safe Assist keyword mode + manual UI |
| STT unavailable | Typed input |
| Train API unavailable | Synthetic cached dataset |
| Payment unknown | Verify existing transaction |
| Session expired | Re-authenticate and resume journey |
| Scraping unavailable | Use last validated dataset / fixture |
| Database unavailable | Fail safely; do not fabricate state |
| High load | Queue/degraded UX with journey preservation |
| Test Type | Coverage |
| Unit | Intent parser, validators, payment transitions, recommendation logic |
| API | Auth, journey, train, booking, payment endpoints |
| AI contract | Valid/invalid JSON, ambiguity, prompt injection resistance |
| Frontend | Components, form validation, responsive states |
| E2E | Home → search → train → booking → payment → ticket |
| Security | Secret leakage, auth boundaries, injection, rate limiting |
| Failure | Payment UNKNOWN, session expiry, AI outage, network interruption |
| Phase | Deliverable |
| Phase 1 | Project scaffold, design system, routing and synthetic database |
| Phase 2 | Home, Discover, Train Search and deterministic comparison |
| Phase 3 | Journey state + Booking + safe autofill |
| Phase 4 | Nira + NVIDIA integration + schema validation |
| Phase 5 | Authentication + mock bank/payment flow |
| Phase 6 | Tracker + ticket + failure states |
| Phase 7 | Scrapling ingestion + normalized data pipeline |
| Phase 8 | PortalPulse-inspired fair-access simulation |
| Phase 9 | Security, E2E, accessibility and performance hardening |
| Phase 10 | Demo script, disclosures, deployment and final polish |
| Setting | Recommendation |
| AI provider | NVIDIA API/NIM-compatible endpoint via server-side environment variable |
| AI model | Configured through environment, not hard-coded |
| Database | PostgreSQL connection string |
| Redis | Redis URL |
| Demo mode | ENABLE_DEMO_MODE=true |
| Synthetic payment | ENABLE_MOCK_PAYMENTS=true |
| Synthetic auth | ENABLE_MOCK_AUTH=true |
| Scraping | Run as a controlled ingestion job, not during every user request |
| Risk | Mitigation |
| AI behaves unpredictably | Strict schema + allowlist + deterministic services |
| Demo depends on external AI | Safe Assist fallback + cached fixtures |
| Scraped data changes | Validated normalized snapshot + synthetic demo dataset |
| Payment flow looks fake | Implement explicit state machine and recovery states |
| Too much UI complexity | Primary-action-first design and progressive disclosure |
| Security claims become misleading | Clearly label mock auth/payment and limitations |
| Scope explosion | Prioritize one complete IRCTC citizen journey |