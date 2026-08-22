# 📋 NIRANTAR Engineering Roadmap & Milestones

> **Target:** 100% Local-First ₹0 Architecture for High-Concurrency Public Infrastructure

---

## 🧭 Milestone 0: Foundation & Digital Twin (Complete)
- [x] Canonical Pydantic integration contracts (`contracts/`)
- [x] Provider-agnostic LLM adapter with restricted tool registry (`backend/app/adapters/llm/`)
- [x] Synthetic Digital Twin microservices and database engine (`m0_digital_twin/`, `services/`)
- [x] NetworkX service dependency graph and critical path engine (`orchestrator/graph/`)
- [x] Real-time telemetry generator with Tatkal rush and outage scenarios (`simulation/telemetry/`)
- [x] Automated pytest test suite (`tests/`)

---

## 🧠 Milestone 1: M1 Civic Journey & Multilingual UX (Agent 4: SAATHI) [COMPLETE]
- [x] Intent parsing contracts and offline rule-based fallback (`contracts/citizen.py`, `backend/app/adapters/llm/`)
- [x] Multilingual Indic NLP query extraction (English, Hindi, Bengali) (`backend/app/services/citizen/intent_extractor.py`)
- [x] Voice audio transcription adapter hook (`backend/app/services/citizen/voice_interface.py`)
- [x] Progressive disclosure conversational journey engine & Top-3 itinerary filter (`backend/app/services/citizen/journey_engine.py`)
- [x] Failure recovery engine & 1-click retry logic (`backend/app/services/citizen/failure_recovery.py`)
- [x] Citizen API endpoints (`backend/app/api/citizen.py`)

---

## ⚡ Milestone 2: M2 Predictive Intelligence (Agent 2: NOVA) [COMPLETE]
- [x] Telemetry feature engineering & derived ratios (`ml/features/telemetry.py`)
- [x] Synthetic telemetry dataset generator across 4 scenarios (`ml/data/generator.py`)
- [x] Baseline XGBoost capacity & overload risk classifier (`ml/models/baseline/xgboost_model.py`)
- [x] PyTorch Multi-output MLP predicting CPU, Latency, Throughput, and Error (`ml/models/neural/multi_output_mlp.py`)
- [x] scikit-learn Isolation Forest anomaly detector (`ml/models/anomaly/isolation_forest.py`)
- [x] Transparent SHAP factor importance attribution engine (`ml/evaluation/explainability.py`)
- [x] 5-Model Empirical Benchmark Suite (`ml/training/compare.py`)
- [x] Unified real-time prediction service & API routes (`backend/app/services/prediction/predictor.py`, `backend/app/api/predictions.py`)

---

## 🛡️ Milestone 3: M3 Security, KAVACH & Provable Trust (Agent 5: KAVACH)
- [x] Security assessment schemas & threat verdicts (`contracts/security.py`)
- [x] Cairo verifiable telemetry STARK contract (`cairo/src/lib.cairo`, `cairo/Scarb.toml`)
- [ ] Redis sliding-window token bucket rate limiter (`security/controls/`)
- [ ] Bot traffic classifier and behavioral anomaly scorer (`security/detection/`)
- [ ] Zero-PII masking and audit logger (`security/privacy/`, `security/audit/`)

---

## ⚙️ Milestone 4: M4 Resilience & DSA Orchestration (Agent 3: DHARA)
- [x] Orchestration decision and queue action schemas (`contracts/orchestration.py`)
- [x] NetworkX failure blast radius simulation (`orchestrator/graph/`)
- [ ] Priority queue manager (`heapq`, `collections.deque`) with multi-tier admission (`orchestrator/scheduling/`)
- [ ] Dynamic load shedding and non-critical service degradation (`orchestrator/resilience/`)
- [ ] Deterministic policy decision engine (`orchestrator/decision_engine/`)

---

## 📊 Milestone 5: M5 10K-VU Simulation & Command Center (Agent 5 + Agent 4)
- [x] Locust headless load testing harness (`loadtest/locustfile.py`, `loadtest/journeys/search.py`)
- [x] Multi-scenario workload generator (Normal, Peak, Extreme, Spike, Bot Surge, DB slowdown)
- [x] React + TypeScript Command Center (control loop, not a generic dashboard)
- [ ] WebSocket streaming endpoint for live telemetry (`backend/app/api/telemetry.py`)
- [ ] Automated A/B comparative resilience benchmark runner (`scripts/run_experiment.py`)

---

## 🧪 Milestone 6: PRAYOG Synthetic Users + Chaos (Module 6)
- [x] Virtual citizens (`user_id`, intent, language, device, arrival, think, duration, journey)
- [x] Persona mix for 10k VUs (`simulation/personas/`)
- [x] Realistic BOOK_TRAIN journeys (not `GET /` hammering)
- [x] Locust persona users + spike LoadTestShape (`loadtest/`)
- [x] Distributed master/worker scripts (`loadtest/distributed/`)
- [x] Scenarios A–F + in-process engine (`simulation/engine.py`)
- [x] Chaos injector (CPU, latency, DB ×5, API fail, outage) + DHARA critical-journey verdict
- [x] PRAYOG API (`/api/v1/prayog/*`)
- [ ] GAN/VAE traffic synthesis (deferred — deterministic personas are sufficient)

---

## 🖥️ Milestone 7: Command Center (Module 7)
- [x] Live system state strip (users, RPS, CPU, latency, error rate)
- [x] Forecast + overload-in-seconds warning
- [x] Kavach security counts
- [x] AUTH → BOOKING → DB/PAYMENT graph with bottleneck callout
- [x] Dhara recommended actions
- [x] Intervention timeline
- [x] Snapshot API `GET /api/v1/command-center/snapshot`

---

## 📦 Module layout
- [x] All numbered modules live under `modules/m01_*` … `modules/m10_*` (shims at old paths)
