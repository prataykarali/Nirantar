# 🇮🇳 NIRANTAR: AI-Powered Public-Service Resilience Platform

> **Predictive Traffic Intelligence, Deep Learning Telemetry Simulation, Real Database Persistence & Provable Trust for High-Concurrency Public Infrastructure.**
> 
> *Project Codename:* **NIRANTAR** | *Flagship Benchmark:* **Peak Tatkal-Scale Surge (10,000+ VUs)**

---

## 🏛️ The Core Architectural Principle

> **"External APIs should be optional adapters. Core intelligence, simulation, orchestration, database, security, and dashboards must run locally."**

NIRANTAR is designed from first principles for **₹0/near-₹0 hackathon and production-grade resilience**. It operates under full network isolation (Internet OFF mode) with zero paid API lock-in.

Canonical map: `docs/architecture/system.md`

```
                         ┌──────────────────────────┐
                         │        CITIZEN            │
                         │ "Book an overnight train  │
                         │  Kolkata → Delhi"          │
                         └────────────┬───────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M1  NIRANTAR CITIZEN UX  │
                         │  Intent · guidance        │
                         └────────────┬───────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M2  WORKFLOW ENGINE      │
                         │  Intent → Actions → Tools │
                         └────────────┬───────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  MOCK RAILWAY BACKEND     │
                         │  Search → Booking → Pay   │
                         └────────────┬───────────────┘
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
              M3 PORTALPULSE     M4 KAVACH        M5 DHARA
                 Predict          Detect           Decide
                     └────────────────┼────────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M6  PRAYOG SIMULATION    │
                         │  1K → 5K → 10K VUs        │
                         └────────────┬───────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │  M7  COMMAND CENTER       │
                         └────────────┬───────────────┘
                         ┌────────────┴─────────────┐
                         ▼                          ▼
                    M8 CAIRO TRUST            M9 EVALUATION
                         └────────────┬─────────────┘
                                      ▼
                               M10 SAFETY / HONESTY /
                                   SUBMISSION LAYER
```

---

## 🧭 The 5 Codex Agents & Ownership

NIRANTAR divides system development into 5 specialized Codex agents with clear ownership boundaries:

| Agent | Codename | Role | Owns | Responsibilities |
|---|---|---|---|---|
| **Agent 1** | **ORBIT** | Architect | `contracts/`, `docs/`, `backend/core/`, `backend/api/`, Database, Docker, CI/CD | System architecture, API contracts, Pydantic schemas, database migrations, Docker |
| **Agent 2** | **NOVA** | Intelligence | `ml/` | Datasets, feature engineering, XGBoost, PyTorch Multi-output MLP, Isolation Forest, SHAP |
| **Agent 3** | **DHARA / FORGE** | Orchestrator | `orchestrator/`, `services/` | DSA, NetworkX service graphs, priority queues, admission control, load shedding |
| **Agent 4** | **SAATHI** | Experience | `frontend/`, `backend/services/citizen/`, `backend/app/adapters/llm/` | Citizen portal, command center, LLM intent extraction, multilingual UX (Indic NLP), tool calling |
| **Agent 5** | **KAVACH / SENTINEL** | Security & SRE | `security/`, `simulation/`, `loadtest/`, `cairo/`, `observability/` | Threat detection, 10K Locust VUs, chaos testing, Cairo proof verification, Prometheus/OTEL |

---

## 📁 Repository Structure

```
NIRANTAR/
├── README.md                           # Master project documentation & architecture
├── .companyrc                          # AI Agent Company workforce configuration
├── .env.example                        # Environment variables template
├── docker-compose.yml                  # Postgres, Redis, Prometheus, Grafana stack
├── Makefile                            # Developer automation commands
├── pyproject.toml                      # Dependencies & pytest configuration
│
├── modules/                            # All 10 product modules (source of implementation)
│   ├── m01_citizen_ux/                 # Module 1 — Citizen UX
│   ├── m02_workflow_engine/            # Module 2 — Workflow engine
│   ├── m03_portalpulse/                # Module 3 — PortalPulse (predict)
│   ├── m04_kavach/                     # Module 4 — Kavach (detect)
│   ├── m05_dhara/                      # Module 5 — Dhara (decide)
│   ├── m06_prayog/                     # Module 6 — Prayog (simulate)
│   ├── m07_command_center/             # Module 7 — Command Center
│   ├── m08_cairo_trust/                # Module 8 — drop new Cairo files here
│   ├── m09_evaluation/                 # Module 9 — Evaluation
│   └── m10_safety/                     # Module 10 — Safety / honesty
│
├── docs/                               # Architecture, ADRs, and API specifications
│   ├── architecture/
│   │   └── system.md                   # High-level architecture & tech stack
│   └── decisions/
│       ├── ADR-001-local-first.md       # Local-first ₹0 architecture decision
│       ├── ADR-002-llm-provider.md      # Provider-agnostic LLM adapter & tools
│       └── ADR-003-cairo.md             # Narrow Cairo verifiable trust primitive
│
├── contracts/                          # Canonical Pydantic integration contracts
│   ├── __init__.py
│   ├── citizen.py                      # Intent & journey schemas
│   ├── experiment.py                   # Resilience benchmark & metric schemas
│   ├── orchestration.py                # Queue, admission & load shed schemas
│   ├── prediction.py                   # Model forecast & SHAP explanation schemas
│   ├── security.py                     # Threat assessment & access control schemas
│   ├── simulation.py                   # Workload & chaos configuration schemas
│   └── telemetry.py                    # Real-time metric & derived feature schemas
│
├── backend/                            # FastAPI Modular Monolith
│   └── app/
│       ├── main.py                     # Central API gateway & OpenAPI docs
│       ├── api/                        # Route controllers (/api/v1/...)
│       ├── core/                       # Database, Redis, config, security
│       ├── models/                     # SQLAlchemy models
│       ├── schemas/                    # Pydantic schemas
│       ├── services/                   # Business & domain services
│       ├── adapters/
│       │   └── llm/                    # Ollama (Local ₹0), Gemini, OpenAI, Tool Registry
│       └── policies/                   # Rate limits, access control, admission
│
├── ml/                                 # Machine Learning & Explainability
│   ├── data/                           # Raw, processed, and synthetic datasets
│   ├── features/                       # Telemetry & capacity feature engineering
│   ├── models/                         # Baseline GBDT, PyTorch MLP, Isolation Forest
│   ├── training/                       # Train & validation scripts
│   └── evaluation/                     # SHAP explainability & critical region checks
│
├── orchestrator/                       # Deterministic Resilience & DSA Engine
│   ├── graph/                          # NetworkX dependency graph & critical path
│   ├── scheduling/                     # Priority queues & admission control
│   ├── resilience/                     # Load shedding, circuit breakers, cache layer
│   └── decision_engine/                # Policy & action dispatchers
│
├── security/                           # KAVACH Security & Privacy
│   ├── detection/                      # Bot classification & anomaly scoring
│   ├── controls/                       # Redis rate limiters & token buckets
│   ├── audit/                          # Audit logging & event streaming
│   └── privacy/                        # Zero-PII anonymization & data masking
│
├── simulation/                         # Digital Twin & Chaos Simulation
│   ├── scenarios/                      # Tatkal rush, normal, database failure profiles
│   ├── personas/                       # Citizen, scalper bot, retry storm personas
│   ├── telemetry/                      # Real-time synthetic telemetry emitter
│   └── chaos/                          # Latency injection, DB partition, CPU spikes
│
├── loadtest/                           # 10,000 Virtual User Load Generation
│   ├── locustfile.py                   # Locust master harness
│   ├── users/                          # FastHttpUser definitions
│   ├── journeys/                       # Search, booking, queue status journeys
│   └── distributed/                    # Master/worker execution scripts
│
├── services/                           # Digital Twin Microservices
│   ├── railway/                        # Mock Railway booking & inventory engine
│   └── common/                         # Auth, notifications, mock payment
│
├── frontend/                           # React + TypeScript Command Center
│   ├── src/
│   │   ├── app/                        # Main React application shell
│   │   ├── components/                 # shadcn/ui components
│   │   ├── charts/                     # Recharts real-time telemetry panels
│   │   └── graph/                      # React Flow service dependency graph
│   └── public/
│
├── cairo/                              # Cairo Verifiable STARK Trust Primitive
│   ├── Scarb.toml                      # Scarb build configuration
│   └── src/
│       └── lib.cairo                   # Verifiable telemetry & security proof
│
├── observability/                      # Metrics & Tracing
│   ├── prometheus/                     # Prometheus scrape configs
│   ├── grafana/                        # Grafana dashboards
│   └── otel/                           # OpenTelemetry collector config
│
├── tests/                              # Automated Pytest Suite
│   ├── test_contracts_and_llm_adapters.py
│   └── test_m0_digital_twin.py
│
├── scripts/                            # CLI Automation Scripts
│   ├── setup.sh
│   ├── seed_db.py
│   └── run_simulation.py
│
└── .company/                           # Encapsulated AI Agent Company Blueprint
    ├── agents/                         # Global workforce profiles
    ├── evals/                          # Code quality & UX evaluators
    ├── pipelines/                      # CI/CD pipeline definitions
    └── rules/                          # File governance & MASTER_CODER policies
```

---

## 🔬 Core Architectural Invariants

1. **LLM as Intent Parser, Not Traffic Controller:**
   The LLM translates multilingual citizen input (Hindi, Bengali, English) and explains model decisions. Deterministic Python engines (`orchestrator/`, `security/`) enforce admission queues, rate limits, and database protections.
2. **Zero-PII Synthetic Sandbox:**
   All citizen identities, PNRs, and transaction IDs are synthetic and masked (`P*** K****`, `VID-XXXX-1234`).
3. **Provable Trust Primitive:**
   Cairo is used strictly as a narrow, verifiable STARK proof primitive (`cairo/src/lib.cairo`) to mathematically verify telemetry batches and policy enforcement with zero gas fees.
4. **10,000-User Distributed Load Generation:**
   Locust simulates realistic citizen and scalper bot traffic hitting the FastAPI backend, demonstrating queue activation, load shedding, and database protection in real time.

---

## 🚀 Quickstart Guide

### 1. Run Automated Test Suite
```bash
make test
```

### 2. Launch Local FastAPI Digital Twin Server
```bash
make dev
# API runs at http://localhost:8000
# OpenAPI documentation at http://localhost:8000/docs
# Operator Command Center: GET /api/v1/command-center/snapshot
```

### 3. Run 100–10,000 Virtual User Load Test
```bash
make load-test
# In-process PRAYOG (no Locust cluster required):
make prayog
python3 -m simulation.engine F 200   # scenario F: 10k-shape + DB latency ×5, sampled
```

### 4. Run Code Quality & Architecture Review
```bash
make review
```

### 5. Launch Docker Infrastructure (PostgreSQL, Redis, Prometheus)
```bash
make compose-up
```

---

*Built with ❤️ for resilient, accessible public services in India.*
