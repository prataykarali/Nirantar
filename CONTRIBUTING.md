# 🏛️ NIRANTAR Engineering Guidelines: Source of Truth & Zero-Hardcoding Rule

> **CRITICAL ARCHITECTURAL RULE:** **NO HARDCODED SYSTEM STATE.**
>
> If a value can change because of a user, database, model, simulation, configuration, API, security event, or deployment, it **MUST NOT** be hardcoded in the frontend.
>
> **The frontend is a renderer, not the source of truth.**

---

## 🧭 Source of Truth Map

```
                    ┌──────────────┐
                    │ CONFIGURATION│ (.env, config.yaml, policies)
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         DATABASE       MODELS       SIMULATION (10k Locust VUs)
      (Digital Twin)  (XGB/PyTorch)       │
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    BACKEND SERVICES (FastAPI)
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       TELEMETRY       DECISIONS       EVENTS (SHAP / STARK proofs)
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                       WEBSOCKET / REST API
                           │
                           ▼
                      FRONTEND (React)
                           │
                           ▼
                   "SHOW THE TRUTH"
```

---

## 🚨 The 42 Non-Negotiable Hard-Coding Rules

| Category | Forbidden Hardcoded Pattern | Correct Source of Truth |
|---|---|---|
| **1. Live Metrics** | Hardcoded numbers for CPU %, Users, Latency, RPS | Telemetry Emitter $\to$ FastAPI $\to$ WebSocket/REST $\to$ UI |
| **2. AI Predictions** | Fixed strings like `"Overload in 4 min"` | `PredictionResult` contract emitted by ML models |
| **3. AI Explanations** | Static `"High CPU is causing problem"` | `ml/evaluation/explainability.py` (SHAP factor breakdown) |
| **4. Chatbot Replies** | Hardcoded bot dialog strings | Dynamic LLM reasoning via NVIDIA NIM + Real-time Tool Registry |
| **5. Service Status** | Hardcoded `"Railway -> Operational"` | Service Registry + Dynamic Health Aggregator |
| **6. Service Names** | Hardcoded list `["Railway", "Hospital"]` in UI | Service Registry API endpoint (`/api/v1/graph/topology`) |
| **7. System Capacity** | Static `MAX_USERS = 10000` in UI | `CapacityFeatureCalculator` + M/M/1 queuing calculation |
| **8. 10k Simulation** | `if users == 10000: overload()` | Continuous parameter distributions in `simulation/` & Locust |
| **9. Dependency Graph**| Fixed nodes/edges in React component | NetworkX Directed Acyclic Graph (`orchestrator/graph/`) |
| **10. Queue Metrics** | Fixed `Priority Queue = 327` | Priority Queue Scheduler (`orchestrator/scheduling/`) |
| **11. Policy Decisions**| Hardcoded priority checks in UI | Dynamic Policy Config (`contracts/orchestration.py`) |
| **12. Security Alerts**| Fake bot attack warnings in React | `contracts/security.py` + Isolation Forest / Kavach Engine |
| **13. Threat Scores** | Static `Threat Level: 87` | Security Risk Scorer with confidence signals |
| **14. Security Actions**| Static `BLOCKED` UI badges | Security Enforcement Engine (`ALLOW`, `THROTTLE`, `BLOCK`) |
| **15. Timestamps** | Static `12:43:21` time strings | Server timestamps (`event.timestamp`) |
| **16. Relative Time** | Static `"Updated 2s ago"` | Dynamic `now - updated_at` calculation |
| **17. Incidents** | Hardcoded incident logs | Incident Registry & Audit Log Stream |
| **18. Recommendations**| Static `"Enable rate limiting"` | Recommendation Engine (`ACTION`, `REASON`, `CONFIDENCE`) |
| **19. Scale Triggers**| `if cpu > 80: scale()` in UI | Decision Engine (`orchestrator/decision_engine/`) |
| **20. Model Metrics** | Static `Accuracy: 96.4%` | Model evaluation pipeline (`ml/training/compare.py`) |
| **21. Model Version** | Fixed `NIRANTAR-MODEL-V3` | Dynamic metadata contract (`version`, `trained_at`) |
| **22. Chart Series** | Hardcoded numeric arrays in charts | Live telemetry timeseries buffers |
| **23. Geo Data** | Fake regional health values | Regional telemetry aggregation engine |
| **24. India Stats** | Unverified `"10M citizens protected"` | Explicitly labeled `Simulation Estimate` or `Live Twin` |
| **25. Impact Metrics**| Fixed `"73% latency reduction"` | Empirical A/B experiment runner comparison |
| **26. Experiments** | Hardcoded trial outcomes | Experiment records with baseline vs Nirantar metrics |
| **27. User Personas** | Fixed percentages inside Locust scripts | Configurable scenario definitions (`personas.yaml`) |
| **28. Arrival Rates** | `users += 100` every tick | Scenario configuration (`target_users`, `ramp_up_seconds`) |
| **29. Thresholds** | Magic numbers scattered in files | Centralized Policy Configuration (`policies/thresholds.py`) |
| **30. Rate Limits** | Random `100 req/min` constants | `RateLimitPolicy` per service tier |
| **31. LLM Provider** | Direct hardcoded `OpenAI(...)` calls | Unified `LLMProvider` factory with NVIDIA NIM adapter |
| **32. API Keys** | In-code secrets | Environment variables in `.env` (gitignored) |
| **33. Credentials** | Hardcoded database / redis URLs | Environment variables (`DATABASE_URL`, `REDIS_URL`) |
| **34. Endpoint URLs** | Hardcoded `http://localhost:8000` | `VITE_API_URL` & `VITE_WS_URL` environment variables |
| **35. Feature Flags** | Hardcoded booleans | Feature Flag Registry (`CAIRO_ENABLED`, `LLM_ENABLED`) |
| **36. Multi-language**| Thousands of hardcoded translations | Centralized localization layer + LLM localized generation |
| **37. Workflows** | Hardcoded step sequences in React | Workflow Engine DAG schemas |
| **38. DB Records** | Duplicated database rows in `data.ts` | SQLite / PostgreSQL Digital Twin APIs |
| **39. Fake Ticks** | `setInterval(() => cpu += Math.random())` in UI | WebSocket telemetry streaming from backend simulation |
| **40. STARK Proofs** | Hardcoded `"Proof verified"` badges | Cairo STARK verifier return contract (`verified`, `proof_id`) |
| **41. Audit Logs** | Static fake event history | Immutable audit event log stream |
| **42. System Health** | Static `"ALL SYSTEMS OPERATIONAL"` | Real-time Health Aggregator |

---

## 🟡 What CAN Be Hardcoded in the Frontend?

- Page layout, grid structure, animations, and CSS tokens.
- Navigation titles (`Citizen SAATHI`, `SRE Command Center`, `Topology DAG`).
- Table column headers, chart axis labels, and metric units (`ms`, `users`, `%`, `RPS`).
- Empty state placeholders and loading skeletons.
