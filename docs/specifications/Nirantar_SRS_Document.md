NIRANTAR
Software Requirements Specification (SRS)
AI-Assisted Railway Journey Platform
Hackathon Prototype • IRCTC-focused • Synthetic / Mock Data


# Table of Contents
Introduction
Product Vision and Goals
Scope
Stakeholders and User Classes
Product Overview
User Journey and Page Structure
Functional Requirements
AI Safety and Security Requirements
System Architecture
Data Requirements
External Services and Technology Stack
PortalPulse / Fair Access Integration
Non-Functional Requirements
UI/UX Requirements
Prototype, Mocking and Compliance Boundaries
Acceptance Criteria
Risks and Mitigations
Future Scope
# 1. Introduction
## 1.1 Purpose
This Software Requirements Specification defines the functional, non-functional, security, AI, data, interface and prototype requirements for Nirantar. Nirantar is an IRCTC-focused citizen journey prototype designed to reduce search, decision, navigation, form-entry and payment-recovery friction while keeping the citizen in control of sensitive actions.
## 1.2 Problem Statement
Railway booking can require users to interpret many options, navigate multiple steps, enter repetitive information, understand payment states and recover from uncertain failures. Nirantar addresses these problems through conversational intent capture, explainable train comparison, contextual guidance, safe autofill, continuous journey state and payment recovery.
## 1.3 Product Principle
Nirantar must make AI useful without making AI authoritative over identity, credentials, money or irreversible decisions. Sensitive information is architecturally isolated from the LLM.
# 2. Product Vision and Goals
Vision: make a railway booking journey feel continuous, understandable and safe rather than fragmented, form-heavy and uncertain.
Enable natural voice or text journey requests.
Reduce decision overload through train comparison and explanations.
Guide users to the exact next action.
Autofill only low-risk fields after confirmation.
Maintain continuous booking and payment state in the prototype.
Prevent duplicate-payment behavior when transaction status is uncertain.
Use infrastructure intelligence to support fair access during high-demand periods.
Provide transparent AI action history and clear mock-data disclosure.
# 3. Scope
## 3.1 In Scope
IRCTC-oriented railway journey discovery and booking prototype.
Voice/text journey intent capture.
Train search, filtering, ranking and explainable recommendations.
Contextual UI guidance with visual arrows/highlights.
Safe autofill of approved non-sensitive fields.
Allowlisted AI action execution through a deterministic action layer.
Continuous mock booking workflow.
Mock payment workflow with success, failure and unknown-payment states.
Journey tracker and digital ticket completion screen.
Nira contextual assistant overlay.
Fair Access Guard using synthetic telemetry and PortalPulse-derived signals.
Synthetic/mock user, passenger, train and payment data.
## 3.2 Out of Scope
Direct production booking on IRCTC.
Real payment processing.
Real OTP, UPI PIN, CVV, card, password or banking credential handling.
Access to private, undocumented or restricted government APIs.
Scraping private or authenticated pages.
Production-grade identity verification.
Claims of official government ownership, approval or partnership.
Unrestricted autonomous browser control by an LLM.
# 4. Stakeholders and User Classes

# 5. Product Overview
Citizen-facing pages:
Home
Discover
Train Results
Journey / Booking
Review + Safe Autofill
Payment
Journey Tracker
Ticket / Completion
Global UI:
Nira AI contextual overlay
Notifications
Help
Profile / security and AI action log
Background modules:
Nira Intent Engine
Safe Action Engine
Train / Recommendation Engine
Journey State Engine
Payment State Machine
Fair Access Guard
PortalPulse telemetry and predictive intelligence
# 6. User Journey and Page Structure

The eight pages represent one continuous citizen journey. Technical modules remain behind the interface so Nirantar does not reproduce the complexity of a conventional portal.
# 7. Functional Requirements
## 7.1 M1 — Nira Intent Engine

## 7.2 M2 — Train & Travel Finder

## 7.3 M3 — Guided Journey Navigation

## 7.4 M4 — Safe AI Autofill

## 7.5 M5 — Safe Action Engine

## 7.6 M6 — Continuous Booking & Payment

## 7.7 M7 — Fair Access Guard

## 7.8 M8 — Journey Tracker

## 7.9 M9 — AI Transparency

# 8. AI Safety and Security Requirements
Security is a product requirement, not a disclaimer.
The LLM shall receive structured intent and approved context rather than raw credential data.
Passwords, OTPs, UPI PINs, CVVs, full card details, session cookies, authentication tokens and similar secrets shall never be included in LLM prompts.
Sensitive actions shall be performed through controlled UI components and deterministic backend logic.
LLM responses shall be treated as untrusted input and validated before action execution.
Provider API keys shall remain server-side.
Synthetic data shall be used for hackathon demonstrations.
Logs shall avoid storing sensitive secrets.
The prototype shall clearly disclose mock functionality and shall not imply official government affiliation.
# 9. System Architecture
High-level workflow:
USER → Voice/Text → Nira Intent Engine → Structured Intent → Schema/Action Validator → Allowlisted Action → Domain Service → Journey State → UI
Sensitive path: USER → Secure UI Component → Controlled Backend/Mock Service. Sensitive information is isolated from the LLM.
Reference architecture:
Frontend (Next.js / React / TypeScript)
        ↓
FastAPI Backend
        ├── Intent Service → NVIDIA NIM
        ├── Safe Action Engine
        ├── Train Service
        ├── Journey Service
        ├── Payment State Machine
        ├── Fair Access Guard
        └── Telemetry Service
        ↓
PostgreSQL + Redis
        ↓
PortalPulse ML / telemetry layer
# 10. Data Requirements

## 10.1 Data Minimization
Only data necessary for the current journey shall be stored. Sensitive financial and authentication data is excluded from the prototype data model.
# 11. External Services and Technology Stack

# 12. PortalPulse / Fair Access Integration
PortalPulse is an internal intelligence layer rather than a citizen-facing dashboard. It provides telemetry, anomaly and capacity signals to Nirantar's Fair Access Guard.
PortalPulse receives synthetic traffic telemetry.
Predictive models may estimate CPU, latency, throughput or other infrastructure behavior.
Anomaly logic identifies unusual traffic patterns.
Fair Access Guard translates signals into proportionate prototype actions such as rate limiting, verification or queueing.
The citizen UI communicates only meaningful status, not operational dashboards.
# 13. Non-Functional Requirements

# 14. UI/UX Requirements
The interface shall feel like one continuous journey rather than a collection of government forms.
The primary interaction shall be visually obvious on every page.
Nira shall appear as a contextual overlay rather than occupying the whole screen by default.
The journey progress indicator shall remain visible during booking.
The UI shall use concise language and strong visual hierarchy.
Visual guidance may use animated arrows, highlights and focus states without blocking interaction.
The product may use a premium friendly 3D visual language while preserving clarity and restraint.
Government logos or branding shall not be used in a way that suggests official endorsement.
# 15. Prototype, Mocking and Compliance Boundaries
Nirantar is a prototype. It shall not access, test or interfere with a live government system, reverse-engineer private systems, scrape restricted information, or process real sensitive credentials or payments.
Prototype disclosure: Nirantar is an independent prototype. Train inventory, accounts, payment events and booking responses shown in the demonstration are synthetic/mock unless explicitly identified as permitted public information. No real payment credentials, OTPs or government account credentials are used.
# 16. Acceptance Criteria
A reviewer can start from Home and complete a simulated railway booking without external help.
The user can describe a journey by text and, where supported, voice.
The system displays extracted journey intent before proceeding.
Train results provide useful comparisons and an explainable recommendation.
The user can see exactly where to perform the next booking action.
Safe fields can be prepared/autofilled after confirmation.
The application demonstrates that credentials and payment secrets are outside LLM context.
Payment success, failure and unknown states are demonstrable.
UNKNOWN payment status clearly prevents an unnecessary second payment attempt.
A completed journey produces a synthetic ticket/PNR-style confirmation.
Fair Access Guard can demonstrate a synthetic abnormal-traffic event and proportionate response.
PortalPulse can be demonstrated separately without turning the citizen experience into an admin panel.
All mock data and prototype limitations are disclosed.
# 17. Risks and Mitigations

# 18. Future Scope
Multilingual voice interaction for additional Indian languages.
Accessibility-first interaction modes.
Integration with officially documented APIs if authorization is available.
More robust real-time journey tracking using permitted data sources.
Production-grade identity and payment integrations handled by dedicated secure services.
Formal evaluation of fairness controls and false positives.
Expansion to other public-service journeys only after the railway use case is validated.
# Appendix A — Product USP
Nirantar is not positioned as an AI chatbot for IRCTC. Its proposition is a safe, continuous citizen journey: understand the request, compare options, guide the user, prepare low-risk information, keep payment state understandable, recover from uncertainty, and use infrastructure intelligence to support fair access.
Find. Understand. Book. Recover.
# Appendix B — One-Page Architecture Summary
USER → NIRA (NVIDIA NIM) → STRUCTURED INTENT → VALIDATOR / ALLOWLIST → TRAIN + JOURNEY + AUTOFILL SERVICES → PAYMENT STATE MACHINE → TRACKER / TICKET
                                      ↓
                              FAIR ACCESS GUARD
                                      ↓
                                PORTALPULSE
                         telemetry + anomaly + prediction
Sensitive path: USER → SECURE UI → CONTROLLED BACKEND. Sensitive secrets do not enter the LLM context.
| Field | Value |
| Document Version | 1.0 |
| Status | Prototype / Hackathon SRS |
| Primary User | Indian railway passenger / citizen |
| Platform | Responsive web application |
| Core Principle | AI assists the passenger; it never controls sensitive credentials or final consequential actions. |
| Stakeholder | Role | Needs |
| Citizen / Passenger | Primary | Plan, compare, book and track a railway journey. |
| Hackathon Reviewer | Evaluator | Test the complete citizen journey and assess usability, product thinking and technical depth. |
| System Operator / Developer | Internal | Inspect synthetic telemetry, AI action logs and prototype health. |
| AI Service | System | Interpret intent and generate bounded assistance. |
| Page | Name | Primary Function |
| 01 | Home | Start a journey, search, or access saved journeys. |
| 02 | Discover | Speak/type a request and confirm extracted intent. |
| 03 | Train Results | Compare options and select a suitable train. |
| 04 | Journey / Booking | Enter/confirm passenger and booking information with guidance. |
| 05 | Review + Safe Autofill | Review safe autofilled fields and AI boundaries. |
| 06 | Payment | Complete simulated payment and handle success/failure/unknown states. |
| 07 | Journey Tracker | See current journey state and booking progress. |
| 08 | Ticket / Completion | View the final mock ticket and next actions. |
| ID | Requirement | Priority |
| FR-01 | The system shall accept typed journey requests. | Must |
| FR-02 | The system shall accept speech input where supported by the browser/device. | Must |
| FR-03 | The system shall extract origin, destination, date, time window and passenger count. | Must |
| FR-04 | The system shall display extracted intent for user confirmation before consequential actions. | Must |
| FR-05 | The system shall request clarification when required fields are missing or ambiguous. | Should |
| ID | Requirement | Priority |
| FR-06 | The system shall search a structured mock or permitted public-information dataset. | Must |
| FR-07 | The system shall filter results by date, time, price, class and available attributes. | Must |
| FR-08 | The system shall provide best-overall, cheapest and fastest recommendations. | Must |
| FR-09 | Recommendations shall be based on structured data rather than LLM-generated facts. | Must |
| FR-10 | The system shall provide a concise explanation for a recommendation. | Must |
| ID | Requirement | Priority |
| FR-11 | The system shall display the user's current journey step. | Must |
| FR-12 | The system shall identify the next required action. | Must |
| FR-13 | The system should visually highlight or point to relevant controls. | Should |
| FR-14 | Nira shall answer contextual questions using the current journey state. | Must |
| ID | Requirement | Priority |
| FR-15 | The system shall autofill only allowlisted non-sensitive fields. | Must |
| FR-16 | The system shall require user confirmation before applying prepared booking data. | Must |
| FR-17 | Sensitive authentication and payment secrets shall not be supplied to the LLM. | Must |
| FR-18 | The system shall show which fields were prepared or filled by Nira. | Must |
| ID | Requirement | Priority |
| FR-19 | LLM output shall be converted into a structured action schema. | Must |
| FR-20 | Actions shall be checked against a server-side allowlist. | Must |
| FR-21 | Invalid, unsupported or unsafe actions shall be rejected. | Must |
| FR-22 | Actions affecting sensitive or consequential states shall require explicit user interaction. | Must |
| FR-23 | The client shall not directly execute arbitrary LLM-generated commands. | Must |
| ID | Requirement | Priority |
| FR-24 | The system shall maintain journey state across booking steps. | Must |
| FR-25 | Payment shall support READY, INITIATED, PROCESSING, SUCCESS, FAILED and UNKNOWN states. | Must |
| FR-26 | UNKNOWN payment status shall clearly warn the user not to retry payment. | Must |
| FR-27 | The system shall provide a mock payment-status verification flow. | Must |
| FR-28 | The system shall return the user to the same journey after payment-state resolution. | Must |
| ID | Requirement | Priority |
| FR-29 | The system shall ingest synthetic request-rate and concurrency signals. | Must |
| FR-30 | The system should detect abnormal traffic patterns using configurable thresholds and/or PortalPulse outputs. | Should |
| FR-31 | The system should support synthetic rate-limit, verification and queue actions. | Should |
| FR-32 | The system shall not make identity or criminal determinations solely from traffic behavior. | Must |
| ID | Requirement | Priority |
| FR-33 | The system shall persist a mock journey record. | Must |
| FR-34 | The system shall show booking status and key journey details. | Must |
| FR-35 | The system shall generate a synthetic ticket/PNR-style identifier. | Must |
| ID | Requirement | Priority |
| FR-36 | The system should expose a human-readable AI action history. | Should |
| FR-37 | The system should disclose categories of information Nira did not access. | Should |
| FR-38 | The system shall distinguish AI recommendations from deterministic system results. | Must |
| Entity | Required Prototype Data |
| User | Synthetic user ID, preferences, non-sensitive profile fields. |
| Journey | Origin, destination, date, passengers, selected train, state. |
| Train | Train ID, stations, schedule, duration, classes, synthetic fare/availability. |
| Passenger | Synthetic passenger details permitted for demo autofill. |
| Booking | Journey reference, booking state, synthetic PNR-style ID. |
| PaymentEvent | Synthetic transaction reference, state, timestamp, result. |
| AIAction | Intent/action type, validation result, execution result, timestamp. |
| TelemetryEvent | Request rate, concurrency, latency, error rate and synthetic anomaly signals. |
| Layer | Technology / Approach |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Cache / transient state | Redis |
| LLM | NVIDIA API / NVIDIA NIM through server-side integration |
| Web data ingestion | Scrapling for permitted public, non-sensitive sources |
| ML / infrastructure intelligence | PortalPulse telemetry and predictive/anomaly components |
| Accounts | Synthetic/mock accounts only |
| Payments | Synthetic/mock payment state machine |
| ID | Category | Requirement | Priority |
| NFR-01 | Usability | A first-time user should understand the next action without a manual. | Must |
| NFR-02 | Performance | Primary UI interactions should respond quickly under normal demo load. | Must |
| NFR-03 | Reliability | Journey state must survive page transitions within the prototype. | Must |
| NFR-04 | Security | Sensitive secrets must not enter LLM context. | Must |
| NFR-05 | Explainability | Recommendations and AI actions should be understandable. | Must |
| NFR-06 | Accessibility | Keyboard navigation, readable contrast, clear labels and non-color-only status indicators should be supported. | Should |
| NFR-07 | Scalability | Mock services should be replaceable by authorized real services later. | Should |
| NFR-08 | Maintainability | Domain and AI services should be separable and testable. | Must |
| NFR-09 | Transparency | Mocked features and dependencies shall be disclosed. | Must |
| Risk | Mitigation | Severity |
| LLM hallucination | LLM does not generate authoritative train inventory; structured data is the source of truth. | High |
| Unsafe AI action | Schema validation, allowlists and confirmation gates. | High |
| Credential leakage | Sensitive-data isolation; secrets never enter prompts. | Critical |
| Payment ambiguity | Explicit UNKNOWN state and status verification. | High |
| Over-complex UX | Eight-page journey model with contextual Nira overlay. | Medium |
| False automation accusations | Behavior-based anomaly signals, not identity/criminal labels. | High |
| Live-system dependency | Synthetic/mock backend and permitted public data only. | High |
| Scope creep | Freeze the IRCTC-focused citizen journey; keep PortalPulse behind the experience. | High |