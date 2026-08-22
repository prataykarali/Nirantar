# 📚 NIRANTAR — REST API Route Catalog & Specification

Comprehensive reference of all production-hardened endpoints across Modules M0 through M9.

---

## 1. System & Health Probers (Module 9)

| Method | Endpoint | Description | Auth / Security |
|---|---|---|:---:|
| `GET` | `/api/v1/system/health` | Comprehensive multi-module health probe (M0–M8) | Public |
| `GET` | `/api/v1/system/version` | Platform build manifest & safety invariants | Public |
| `GET` | `/api/v1/system/audit-summary` | Aggregated security, zero-PII & anti-hardcoding audits | Public |

---

## 2. Citizen UX & Multilingual Intent (Module 1)

| Method | Endpoint | Description | Auth / Security |
|---|---|---|:---:|
| `POST` | `/api/v1/citizen/intent` | Natural language intent extraction (en, hi, bn, ta) | Kavach Monitored |
| `GET` | `/api/v1/citizen/autofill/safe-fields` | Retrieve permitted non-sensitive autofill fields | Zero-PII Enforced |
| `POST` | `/api/v1/citizen/explain` | Contextual field explanation & assistance | Rate Limited |

---

## 3. Predictive Intelligence & Capacity Forecasting (Module 2)

| Method | Endpoint | Description | Model Engine |
|---|---|---|:---:|
| `POST` | `/api/v1/predictions/forecast` | Real-time overload prediction & SHAP attribution | XGBoost + SHAP |
| `POST` | `/api/v1/predictions/capacity` | User capacity saturation forecast | LightGBM |
| `POST` | `/api/v1/predictions/anomaly` | Unsupervised telemetry anomaly detection | Isolation Forest |
| `GET` | `/api/v1/predictions/benchmark` | 5-Model empirical benchmark comparison | Multi-Model Suite |
| `GET` | `/api/v1/predictions/critical-region` | 7,000–10,000 VU critical stability validation | Stress Validator |

---

## 4. KAVACH Security & Trust Guard (Module 3)

| Method | Endpoint | Description | Security Scope |
|---|---|---|:---:|
| `POST` | `/api/v1/security/evaluate` | Adaptive session trust scoring & threat verdict | Threat Analysis |
| `POST` | `/api/v1/security/sanitize` | Recursive payload scrubbing for sensitive PII | Zero-PII Sanitizer |
| `GET` | `/api/v1/security/audit-logs` | Immutable audit log trail for security events | Audit Trail |

---

## 5. Action Executor & Resilient Dispatch (Module 4)

| Method | Endpoint | Description | Resilience Layer |
|---|---|---|:---:|
| `POST` | `/api/v1/executor/dispatch` | 3-tier validated action dispatch | 3-Tier Guard |
| `GET` | `/api/v1/executor/allowlist` | Permitted action definitions | Action Allowlist |
| `GET` | `/api/v1/executor/circuit-status` | Real-time circuit breaker state | Circuit Breaker |
| `POST` | `/api/v1/executor/circuit-reset` | Manual reset to CLOSED state | Admin Override |

---

## 6. Grounded Search & Real-time Verification (Module 5)

| Method | Endpoint | Description | Adapter Engine |
|---|---|---|:---:|
| `POST` | `/api/v1/search/scrapling` | High-speed statutory web scraping | Scrapling Fetcher |
| `POST` | `/api/v1/search/ground-verification` | Anti-hallucination fact verification | Grounding Engine |
| `POST` | `/api/v1/search/hybrid-context` | Merged DB, Vector RAG & Scraped facts | Hybrid Context |
| `GET` | `/api/v1/search/cache/stats` | Cache hit/miss telemetry statistics | In-Memory Cache |

---

## 7. PRAYOG 10K Simulation & Load Balancing (Module 6)

| Method | Endpoint | Description | Workload Spec |
|---|---|---|:---:|
| `POST` | `/api/v1/prayog/run-scenario` | Execute stress scenarios (A–F) | 1K to 10K VUs |
| `GET` | `/api/v1/prayog/personas` | Demographic persona catalog (35% Rural, 30% Tatkal, 20% Commuter, 15% Scalper) | Catalog Spec |
| `GET` | `/api/v1/prayog/load-balance-status` | Token bucket capacity & CDN cache status | Edge Gateway |

---

## 8. Command Center & Dhara Self-Healing (Module 7)

| Method | Endpoint | Description | Control Policy |
|---|---|---|:---:|
| `GET` | `/api/v1/command-center/snapshot` | Real-time system telemetry aggregation | Live Aggregator |
| `POST` | `/api/v1/command-center/dhara-control` | Dynamic overload control (L0–L3) | Dhara Engine |
| `GET` | `/api/v1/command-center/self-healing-logs`| Auto-trip & recovery event log | Audit Trail |
