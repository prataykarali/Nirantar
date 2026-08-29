# 📘 PRD — Nirantar Discover

**Mission**: Make India's railway digital services discoverable, understandable, and actionable  
**Product**: Nirantar  
**New capability**: Nirantar Discover  
**Version**: v1.0  
**Status**: Proposed  
**Primary objective**: Solve the discoverability gap around Indian railway digital services — not by replacing official systems, but by helping people find the right service, understand it, and reach it quickly.

---

## 1. Executive Summary

Indian railway users often know what they want to accomplish, but not which digital service they need or where that service lives.

A user thinks:
> “I need to check whether my ticket is confirmed.”

rather than:
> “I need the PNR enquiry service.”

Another thinks:
> “Tatkal kab khulta hai?”

rather than knowing which official page contains the relevant information.

Nirantar Discover converts:
$$\text{Natural-language intent} \longrightarrow \text{Service identification} \longrightarrow \text{Explanation} \longrightarrow \text{Official destination} \longrightarrow \text{Optional Nirantar assistance}$$

The product therefore becomes more than a railway assistant:
> **Nirantar becomes a discovery and guidance layer for India's fragmented railway digital ecosystem.**

---

## 2. The Core Problem

### Current User Journey
```text
User has a problem
       ↓
Searches Google / asks someone
       ↓
Gets multiple results
       ↓
Doesn't know which is official
       ↓
Opens a complicated website
       ↓
Searches again inside the website
       ↓
Gets confused
       ↓
May abandon the task
```

### The Fundamental Problem
The service exists.

But:
> The user doesn't know that it exists, what it's called, where it is, or how to use it.

This is a **discoverability + comprehension + navigation** problem.

---

## 3. Product Vision

### Vision
> **No passenger should need to know the architecture of India's railway services in order to use them.**

Nirantar should allow someone to simply say:
> “I want to check my PNR.”

and receive:
1. What service they need
2. What it does
3. Where to access it
4. What information they need
5. What the relevant railway terms mean
6. What Nirantar can help with

---

## 4. Product Positioning

**Nirantar Discover is NOT:**
- An IRCTC replacement
- An unofficial railway authority
- An SEO blog
- A generic chatbot
- A search-engine clone
- A system pretending to perform actions it cannot perform

**It IS:**
> **An intelligent discovery and guidance layer between passenger intent and railway digital services.**

### Positioning Statement
> *“You know what you need. Nirantar finds the service.”*

---

## 5. Target Users

### Primary
👤 **Passenger who doesn't know the service**  
Examples:
- “Where do I check my PNR?”
- “Tatkal booking kab start hoti hai?”
- “Train late hai kya?”
- “Ticket cancel karne par kitna refund milega?”
- “Platform kaise pata chalega?”

---

### Secondary
🧑‍💻 **Digital-service-aware passenger**  
Knows the service exists but doesn't understand the process.  
Example:
- “I know PNR exists, but what does RAC 27 actually mean?”

---

### Tertiary
👨‍👩‍👧 **Family / occasional traveller**  
Less familiar with railway terminology and interfaces. This group is particularly important because discoverability matters most when railway usage isn't habitual.

---

## 6. Core Product Loop

```text
USER
  │
  ▼
Natural language
  │
  ▼
┌──────────────────┐
│ Intent Detection │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Service Mapping  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Knowledge Layer  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Explain + Guide  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Official Service │
└────────┬─────────┘
         ▼
  USER COMPLETES
     THE TASK
```

> **The Crucial Principle**: Nirantar should reduce the distance between intent and action.

---

## 7. Feature Set

### 7.1 🔎 Natural-Language Service Discovery
User enters anything.

Examples:
- “mera pnr kaha check karu”
- “Tatkal ka timing kya hai?”
- “train ka status dekhna hai”
- “ticket cancel karna hai”
- “platform change hua kya?”

Nirantar identifies the underlying intent.

**Output Structure:**
- **You want**: 🎫 PNR Status
- **What it does**: Check your current reservation status.
- **You'll need**: 10-digit PNR number
- **Official service**: `[Open Official Service →]`

---

## 8. Intent Taxonomy

Build a controlled intent ontology rather than relying entirely on an LLM.

- 🚆 **Booking**
  - General ticket booking
  - Tatkal
  - Premium Tatkal
  - Train search
  - Seat availability
  - Quota information
- 🎫 **Ticket**
  - PNR
  - RAC
  - WL
  - CNF
  - Seat/coach
  - Reservation details
- 📍 **Journey**
  - Train running status
  - Platform
  - Station information
  - Delay
  - Coach position
- 💰 **Money**
  - Cancellation
  - Refund
  - Fare
  - Charges
- 🚨 **Problems**
  - Complaint
  - Lost item
  - Service issue
  - Booking problem
- 📚 **Understanding**
  - Railway terminology
  - Quotas
  - Rules
  - Timings
  - Procedures

---

## 9. 🧠 AI Intent Engine

### Pipeline
```text
Raw query
   ↓
Language detection
   ↓
Intent classification
   ↓
Entity extraction
   ↓
Service matching
   ↓
Confidence score
   ↓
Response
```

### Example
**Input:**
> “bhai mera 1234567890 wala ticket confirm hua?”

**Output:**
- **Intent**: `PNR_STATUS`
- **Entity**: `PNR = 1234567890`
- **Confidence**: `0.97`

---

## 10. Multilingual / Hinglish Discovery

Support natural variants:
- “pnr kaise check kru”
- “mera ticket confirm hoga?”
- “tatkal kab khulta h”
- “train kitna late hai”
- “ticket cancel kaise kare”

**Language Coverage:**
- English
- Hinglish
- Hindi
- Other high-demand Indian languages (Bengali, Tamil, Telugu, etc.)

> **Important**: Don't create thousands of low-quality AI-generated pages. Instead: **One authoritative knowledge source → many natural-language entry points.**

---

## 11. 🗺️ Railway Service Knowledge Graph

Represent relationships such as:

```text
PNR
 │
 ├── checks → Reservation Status
 │
 ├── contains → PNR Number
 │
 ├── states → CNF
 │             RAC
 │             WL
 │
 └── accessed through → Official Service
```

And:

```text
Tatkal
 │
 ├── has → Booking Timing
 ├── has → Quota
 ├── has → Eligibility/Rules
 ├── requires → Passenger Details
 └── accessed through → Official Booking Service
```

This allows Nirantar to answer relationships, not merely retrieve paragraphs.

---

## 12. 🌐 SEO Discovery Layer

Create high-quality intent-focused pages:
- `/pnr-status`
- `/tatkal-booking`
- `/tatkal-timing`
- `/train-running-status`
- `/train-platform`
- `/seat-availability`
- `/rac-meaning`
- `/waiting-list`
- `/ticket-cancellation`
- `/railway-refund`
- `/railway-complaint`
- `/railway-enquiry`

Each page answers:
1. What is this?
2. Who needs it?
3. How does it work?
4. What information is required?
5. What do common railway terms mean?
6. Where is the official service?
7. How can Nirantar help?

---

## 13. SEO Page Architecture

```text
TITLE
│
├── Direct answer
│
├── What is this service?
│
├── When should you use it?
│
├── Step-by-step explanation
│
├── Common problems
│
├── Railway terminology
│
├── Official service
│
└── Ask Nirantar
```

### Example: PNR Status
- **Title**: Check your Indian Railway ticket status
- **What is PNR?**: Short explanation.
- **What you'll need**: 10-digit PNR.
- **What the results mean**: CNF / RAC / WL.
- **Official service**: `→ Open official service`
- **Still confused?**: `→ Ask Nira`

---

## 14. 🤖 AI Search / AEO Strategy

Principles:
- Clear definitions
- Explicit entities
- Authoritative references
- Structured content
- Concise answers
- Semantic headings
- Consistent terminology
- Useful internal linking
- Transparent source attribution
- Updated information

> **Strategy**: Be useful enough that search engines and AI systems can understand what the page actually provides, rather than trying to "hack" the algorithm.

---

## 15. 🔗 Official-Service Routing

Whenever Nirantar does not execute the action directly:
> *“Nirantar can explain this service. To complete the booking, continue to the official railway service.”*

**Button**: `Open Official Service →`

Never pretend Nirantar completed something when it only provided guidance.

---

## 16. 🛡️ Trust Layer

Every service recommendation clearly specifies:
- **Official Railway Service**, OR
- **Nirantar Guidance**, OR
- **Third-party information**

This prevents confusion between Nirantar and official authorities.

---

## 17. 🔍 “I Don't Know What I Need” Mode

Intent-first navigation options:
- 🎫 Check my ticket
- 🚆 Track my train
- ⚡ Book Tatkal
- 📍 Find my platform
- 💰 Cancel / refund
- 🚨 Report a problem
- ❓ Understand railway terms

---

## 18. 🧪 Demo / Nira Integration

**Explore Nira Triggers:**
- 🚆 **Book**: *“Find trains Delhi → Mumbai tomorrow”*
- ⚡ **Tatkal**: *“When does Tatkal open?”*
- 📍 **Radar**: *“What's happening at New Delhi station?”*
- 🎫 **PNR**: *“What does RAC 27 mean?”*
- 🧭 **Discover**: *“I need to cancel my ticket”*

---

## 19. User Journey Scenario

1. **User searches**: *“tatkal booking kaise kare”*
2. **Search result**: Nirantar — Tatkal Booking Guide
3. **User lands on page**: Nirantar explains Tatkal quota & timings.
4. **User clicks**: *“I need to book Tatkal”*
5. **Nirantar checklist**: Prompts for required passenger info.
6. **Direct Route**: `Open Official Booking Service →`
7. **Outcome**: User completes task with zero confusion.

---

## 20. Technical Architecture

```text
┌─────────────────┐
│     USER        │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ Nirantar / Nira UI │
└──────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Intent Engine      │
│ NLP / LLM          │
└──────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌───────────────┐
│ Intent  │ │ Entity        │
│ Ontology│ │ Extractor     │
└────┬────┘ └───────┬───────┘
     └───────┬──────┘
             ▼
┌────────────────────┐
│ Railway Knowledge  │
│ Graph / DB         │
└──────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Service Resolver   │
└──────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
Expl. Off. Nira
      URL  Action
    └────┼────┘
         ▼
    USER ACTION
```

---

## 21. Suggested Technology Stack

- **Frontend**: React / Next.js, Tailwind CSS, Responsive mobile-first UI
- **Backend**: FastAPI / Node, REST API
- **AI / NLP**: LLM for natural-language understanding, Intent classifier, Entity extraction, Confidence scoring
- **Knowledge**: Structured JSON/YAML knowledge base (initially) $\rightarrow$ PostgreSQL, Vector search, Graph representation
- **SEO**: Server-rendered / static pages, Sitemap, robots.txt, Canonical URLs, Structured metadata
- **Analytics**: Intent-to-service funnel tracking

---

## 22. MVP Scope

1. **Service Discovery**: ~15–20 railway intents.
2. **Intent Classification**: English + Hinglish initially.
3. **Service Knowledge Base**: Structured information for target intents.
4. **Official-Service Routing**: Verified destination for each supported service.
5. **10–15 SEO Landing Pages**: High-quality, hand-crafted templates.
6. **Nira Integration**: Natural-language discovery queries.
7. **Analytics**: Intent discovery & completion tracking.

---

## 23. V1 Feature Prioritization

| Feature | Priority |
| :--- | :--- |
| Intent discovery | 🔴 P0 |
| Service mapping | 🔴 P0 |
| Official routing | 🔴 P0 |
| Knowledge base | 🔴 P0 |
| Nira integration | 🔴 P0 |
| SEO landing pages | 🟠 P1 |
| Hinglish | 🟠 P1 |
| Service knowledge graph | 🟠 P1 |
| Analytics | 🟠 P1 |
| Multilingual | 🟡 P2 |
| Personalization | 🟡 P2 |
| Automated content generation | 🟢 Later |
| Large-scale AI search optimization | 🟢 Later |

---

## 24. Success Metrics

- **Primary Metric**: **Intent-to-Service Success Rate** (% of users discovering the correct service).
- **Secondary Metrics**:
  - Service discovery accuracy (Intent $\rightarrow$ Service).
  - Official-service click-through rate.
  - Task completion rate.
  - Search-to-discovery rate.
  - Zero-result rate.
  - Confusion / bounce rate.

---

## 25. North-Star Metric

> 🎯 **Successful Service Discovery**  
> User intent $\longrightarrow$ Correct service identified $\longrightarrow$ User understands it $\longrightarrow$ Official destination reached.

---

## 26. Business / Growth Model

For the hackathon/challenge: focus strictly on **Awareness + Utility** without premature monetization.

Long-term possibilities:
- Public-private partnerships
- Specialized travel assistance
- B2B public service discovery APIs
- Institutional civic infrastructure deployments

---

## 27. Cost Strategy (₹0-Oriented Approach)

- Static SEO pages & free search-console tooling
- Open-source frontend & lightweight backend
- Small, curated JSON/YAML knowledge base
- Controlled LLM usage: *Never call an LLM for deterministic knowledge-base lookups.*

---

## 28. Security & Trust Requirements

- Distinguish official vs. unofficial information clearly.
- Never claim transactions occurred when only guidance was provided (*“Nirantar guides. Official systems execute.”*).
- Zero-PII storage policy: avoid storing unnecessary passenger/PNR data.
- Maintain a verified domain registry with periodic link audits.

---

## 29. Biggest Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Risk 1: SEO Farm perception** | Create authoritative, problem-solving content only. |
| **Risk 2: AI Hallucination** | Grounded pipeline: Knowledge Base $\rightarrow$ Verified Facts $\rightarrow$ LLM explanation. |
| **Risk 3: Outdated/Wrong Links** | Curated official service registry with `last_verified` timestamps. |
| **Risk 4: Scope Explosion** | Focus strictly on Railways first before expanding. |

---

## 30. Future Expansion

```text
NIRANTAR
   │
   ├── 🚆 Railways
   │
   ├── 🪪 Identity services
   │
   ├── 💰 Tax services
   │
   ├── 🏦 Pension services
   │
   ├── 📄 Certificates
   │
   └── 🏛️ Government services
```

> **Long-term Vision**: An intent-based discovery layer for India's digital public infrastructure.

---

## 31. Hackathon Story

- **Problem**: India has digital services, but citizens don't know where they are or how to use them.
- **Observation**: People search for problems, not service names.
- **Solution**: Nirantar understands natural problems and maps them directly to the right official service with clear guidance.
- **Vision**: Make public digital services discoverable without requiring citizens to know how the government system is organized.

---

## 32. The Killer 60-Second Demo

1. **Step 1**: Search query: *“Tatkal booking kaise kare”*
2. **Step 2**: Nirantar identifies ⚡ Tatkal Booking intent.
3. **Step 3**: Displays timings, rules, checklist, and common pitfalls.
4. **Step 4**: Ask Nira: *“Mujhe kal Delhi se Mumbai jaana hai, Tatkal ke liye kya ready rakhu?”* $\rightarrow$ Nira provides instant prep checklist.
5. **Step 5**: Click `Open Official Booking Service →`.
6. **Closing Line**: *“We aren't replacing India's railway infrastructure. We're making it easier for people to discover and use.”*

---

## 33. Final Product Principle

> **“Don't make users learn the system. Make the system understand the user.”**
