# 08 — Repository Structure

> **Project:** PortalPulse Civic (NIRANTAR)
> **Status:** Draft
> **Last Updated:** 2026-08-21

---

## 1. Guiding Principles

| Principle | Detail |
|---|---|
| **Organised by job, not technology** | Directories mirror the five functional modules, not language or framework boundaries. |
| **Clear agent ownership** | Every top-level directory has exactly one owning agent (or an explicit shared designation). |
| **500-line file cap** | File Warden enforces a hard 500-line maximum per source file. Violations block CI. |
| **README in every directory** | Each directory contains a `README.md` explaining its purpose, ownership, and conventions. |

---

## 2. Repository Layout

```
portalpulse-civic/
├── README.md
├── .companyrc                          # Project-level config (extends company_bugs)
├── pyproject.toml
├── docker-compose.yml
│
├── docs/                               # ORBIT owns
│   ├── architecture/
│   │   ├── system_overview.md
│   │   ├── module_boundaries.md
│   │   └── adr/                        # Architecture Decision Records
│   ├── api/
│   │   ├── contracts.yaml              # OpenAPI spec
│   │   └── schemas/
│   └── runbooks/
│
├── m1_civic_journey/                   # SAATHI owns
│   ├── __init__.py
│   ├── intent_extractor.py
│   ├── journey_builder.py
│   ├── voice_interface.py
│   ├── language_router.py
│   └── tests/
│
├── m2_predictive_intelligence/         # NOVA owns
│   ├── __init__.py
│   ├── models/
│   │   ├── xgboost_capacity.py
│   │   ├── pytorch_multioutput.py
│   │   └── lstm_forecast.py
│   ├── training/
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── feature_engine.py
│   ├── inference/
│   │   ├── predict.py
│   │   └── forecast.py
│   ├── data/
│   ├── metrics/
│   └── tests/
│
├── m3_security_trust/                  # SENTINEL owns
│   ├── __init__.py
│   ├── traffic_classifier.py
│   ├── behavior_analyzer.py
│   ├── rate_limiter.py
│   ├── threat_scorer.py
│   └── tests/
│
├── m4_resilience_dsa/                  # FORGE owns
│   ├── __init__.py
│   ├── service_graph.py
│   ├── critical_path.py
│   ├── queue_engine.py
│   ├── load_shedder.py
│   ├── orchestrator.py
│   ├── cache_layer.py
│   └── tests/
│
├── m5_simulation_command/              # SENTINEL + NOVA own
│   ├── __init__.py
│   ├── traffic_generator.py
│   ├── load_simulator.py
│   ├── chaos_engine.py
│   ├── benchmark_suite.py
│   ├── dashboard/
│   │   ├── index.html
│   │   ├── metrics.js
│   │   └── styles.css
│   └── tests/
│
├── frontend/                           # SAATHI owns
│   ├── citizen/
│   │   ├── index.html
│   │   ├── journey_form.js
│   │   ├── queue_status.js
│   │   └── styles/
│   ├── operator_dashboard/
│   │   ├── index.html
│   │   ├── metrics_panel.js
│   │   └── alerts.js
│   └── shared/
│       ├── design_tokens.css
│       ├── i18n/
│       │   ├── hi.json
│       │   ├── bn.json
│       │   ├── en.json
│       │   └── ta.json
│       └── accessibility/
│
├── backend/                            # FORGE owns
│   ├── api/
│   │   ├── __init__.py
│   │   ├── journey_routes.py
│   │   ├── predict_routes.py
│   │   ├── trust_routes.py
│   │   ├── orchestrate_routes.py
│   │   ├── telemetry_routes.py
│   │   └── dashboard_routes.py
│   ├── mock_railway_api.py
│   ├── config.py
│   └── main.py
│
├── security/                           # SENTINEL owns
│   ├── audit/
│   ├── pen_tests/
│   └── compliance/
│
├── tests/                              # SENTINEL owns
│   ├── unit/
│   ├── integration/
│   ├── load/
│   ├── chaos/
│   └── regression/
│
├── ci/                                 # SENTINEL owns
│   ├── Dockerfile
│   ├── .github/workflows/
│   └── scripts/
│
└── .company/                           # Shared
    ├── obsidian/
    ├── prompts/
    └── plans/
```

---

## 3. Agent Ownership Map

| Directory | Owning Agent | Responsibility |
|---|---|---|
| `docs/` | **ORBIT** | Architecture docs, ADRs, API contracts, runbooks |
| `m1_civic_journey/` | **SAATHI** | Intent extraction, journey building, voice & language routing |
| `m2_predictive_intelligence/` | **NOVA** | ML models, training pipelines, inference services, metrics |
| `m3_security_trust/` | **SENTINEL** | Traffic classification, behaviour analysis, rate limiting, threat scoring |
| `m4_resilience_dsa/` | **FORGE** | Service graph, critical path, queue engine, load shedding, caching |
| `m5_simulation_command/` | **SENTINEL + NOVA** | Traffic generation, load simulation, chaos engineering, benchmarks, dashboard |
| `frontend/` | **SAATHI** | Citizen portal, operator dashboard, i18n, accessibility |
| `backend/` | **FORGE** | API routes, mock services, app config, server entrypoint |
| `security/` | **SENTINEL** | Audit logs, penetration tests, compliance artefacts |
| `tests/` | **SENTINEL** | Cross-module unit, integration, load, chaos, and regression tests |
| `ci/` | **SENTINEL** | Docker builds, GitHub Actions workflows, CI helper scripts |
| `.company/` | **Shared** | Obsidian vault, prompt library, planning documents |

---

## 4. Cross-Agent Rules

1. **New top-level directories** — ORBIT must approve the creation of any new top-level directory before it is merged.
2. **Security review gate** — SENTINEL must review every file touching `security/` before merge is permitted.
3. **Ownership boundaries** — No agent may modify another agent's owned directories without explicit, documented approval from the owning agent.
4. **Shared interfaces** — All cross-module API contracts, schemas, and interface definitions live in `docs/api/`. Changes require ORBIT sign-off.
5. **File size enforcement** — File Warden (CI) rejects any source file exceeding 500 lines. Split before committing.
6. **README requirement** — Every new directory must include a `README.md` on creation. Missing READMEs block CI.

---

## 5. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Module directories | `m<N>_snake_case` | `m2_predictive_intelligence` |
| Python files | `snake_case.py` | `intent_extractor.py` |
| Test files | `test_<module>.py` | `test_intent_extractor.py` |
| Frontend files | `snake_case.js / .css / .html` | `journey_form.js` |
| i18n files | ISO 639-1 code `.json` | `hi.json`, `bn.json` |
| ADR files | `NNNN-<slug>.md` | `0001-queue-engine-choice.md` |

---

## 6. Key File Locations

| Purpose | Path |
|---|---|
| OpenAPI contract | `docs/api/contracts.yaml` |
| Project config | `.companyrc` |
| Docker orchestration | `docker-compose.yml` |
| CI pipeline | `ci/.github/workflows/` |
| Mock external API | `backend/mock_railway_api.py` |
| Design tokens | `frontend/shared/design_tokens.css` |
| Architecture overview | `docs/architecture/system_overview.md` |

---

> [!IMPORTANT]
> This structure is the canonical reference. Any deviation requires an ADR filed under `docs/architecture/adr/` and ORBIT approval.
