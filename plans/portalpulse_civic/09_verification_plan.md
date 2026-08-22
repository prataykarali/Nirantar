# Verification Plan — PortalPulse Civic (NIRANTAR)

> **Owner:** SENTINEL (Verification & Quality Gate Agent)
> **Version:** 1.0 · 2026-08-21
> **Scope:** End-to-end verification across all modules (M1–M5)

---

## 1. Verification Layers

### Layer 1: Unit Tests

| Attribute        | Detail                                      |
|------------------|---------------------------------------------|
| **Scope**        | Each module (M1–M5) in its own `tests/`     |
| **Coverage**     | Minimum **80%** line coverage                |
| **Trigger**      | Every commit (pre-merge)                     |
| **Agent**        | SENTINEL                                     |

- All public functions must have at least one positive and one negative test case.
- Mocks are required for external service calls; no real network I/O in unit tests.
- Snapshot tests for serialized `JourneyObject` and `PredictionResult` schemas.

### Layer 2: Integration Tests

| Attribute        | Detail                                                        |
|------------------|---------------------------------------------------------------|
| **Scope**        | Inter-module contracts and data flows                         |
| **Key Flows**    | `JourneyObject` M1 → M4, `PredictionResult` M2 → M3 → M4    |
| **Agent**        | SENTINEL + ORBIT (contract validation)                        |

- **Contract testing:** JSON-Schema and Pydantic model compliance checks at every module boundary.
- **Flow assertions:** Verify that a `JourneyObject` created by M1 is accepted, enriched, and persisted by M4 without data loss.
- **Event ordering:** Confirm Kafka/event-bus message ordering for prediction pipelines.

### Layer 3: ML Model Validation

| Attribute              | Detail                                       |
|------------------------|-----------------------------------------------|
| **Held-out evaluation**| Precision, recall, F1 on test split           |
| **A/B baseline**       | Compare against rule-based fallback           |
| **Adversarial inputs** | Malformed intents, unicode edge cases         |
| **Drift detection**    | PSI / KL-divergence on feature distributions  |
| **Agent**              | NOVA + SENTINEL                               |

- Model must meet minimum F1 ≥ 0.85 on intent classification before promotion.
- Drift alerts fire when PSI > 0.2 on any top-10 feature.

### Layer 4: Load Testing

| Attribute            | Detail                                        |
|----------------------|------------------------------------------------|
| **Target**           | 100K concurrent users (Tatkal-scale)           |
| **Queue engine**     | Verify backpressure and fair-position queuing  |
| **Rate limiting**    | Confirm 429 responses above threshold          |
| **Degradation**      | Graceful fallback when saturation > 90%        |
| **Tools**            | Locust, k6                                     |
| **Agent**            | SENTINEL                                       |

### Layer 5: Chaos Testing

| Fault Scenario         | Expected Behaviour                                    |
|------------------------|-------------------------------------------------------|
| Kill M2 (ML engine)   | M4 falls back to rule-based predictions               |
| Network partition M1↔M4| M1 queues requests locally; retries on reconnect      |
| Database failure       | Read replicas serve stale data; writes buffer in queue |
| Circuit breaker trip   | Breaker opens within 5 s; half-open probe at 30 s     |

- **Agent:** SENTINEL
- Chaos tests run in a dedicated staging namespace; never in production.

### Layer 6: Security Audit

| Check                  | Detail                                                |
|------------------------|-------------------------------------------------------|
| API auth               | JWT validation, token expiry, scope enforcement       |
| Rate limiting          | Per-IP and per-user limits enforced                   |
| Input validation       | Reject oversized payloads, SQL injection, NoSQL injection |
| PII protection         | Aadhaar masked (`XXXX-XXXX-1234`), no PII in logs    |
| Bot detection accuracy | Precision ≥ 0.95, recall ≥ 0.90                      |
| XSS / CSRF             | CSP headers set; CSRF tokens on all state-changing forms |

- **Agent:** SENTINEL

### Layer 7: Accessibility Audit

| Check                  | Detail                                           |
|------------------------|--------------------------------------------------|
| WCAG 2.1 AA            | axe-core automated scan; zero critical violations |
| Screen reader          | Manual pass with NVDA / VoiceOver                |
| Multilingual rendering | Hindi, Tamil, Bengali, Telugu glyph correctness  |
| Voice interface        | WER ≤ 15% for supported languages                |

- **Agent:** SAATHI + SENTINEL

### Layer 8: End-to-End Scenarios

| #  | Scenario                | Steps                                                              | Pass Criteria                          |
|----|-------------------------|--------------------------------------------------------------------|----------------------------------------|
| 1  | Normal booking          | Citizen → journey creation → slot selection → booking confirmation | Booking ID returned in < 3 s           |
| 2  | Tatkal rush             | 10× traffic spike → queue activation → load shed → serve          | p99 wait < 120 s; zero data loss       |
| 3  | Bot attack              | Mass bot traffic → detection → blocking → legit users served      | Bot block rate ≥ 95%; legit pass ≥ 99% |
| 4  | Service degradation     | Backend failure → circuit breaker → graceful fallback UI           | Fallback UI renders in < 2 s           |
| 5  | Multilingual journey    | Hindi voice input → intent extraction → booking                   | Correct intent ≥ 90%; booking success  |

---

## 2. Verification Commands

### Unit Tests (Layer 1)
```bash
# Run all unit tests with coverage
pytest tests/ --cov=src --cov-report=html --cov-fail-under=80 -q

# Run tests for a single module
pytest modules/m2_ml_engine/tests/ -v --tb=short
```

### Integration / Contract Tests (Layer 2)
```bash
# Contract schema validation
pytest tests/integration/ -m contract --tb=long

# Full flow test
pytest tests/integration/test_journey_flow.py -v
```

### ML Validation (Layer 3)
```bash
# Model evaluation on held-out set
pytest tests/ml/ -m evaluation --tb=short

# Drift detection report
python -m nirantar.ml.drift_check --threshold 0.2 --report
```

### Load Testing (Layer 4)
```bash
# Locust — Tatkal-scale simulation
locust -f tests/load/locustfile.py --users 100000 --spawn-rate 5000 \
  --host https://staging.nirantar.gov.in --run-time 10m --headless

# k6 — queue engine stress
k6 run tests/load/k6_queue_stress.js --vus 100000 --duration 10m
```

### Chaos Testing (Layer 5)
```bash
# Kill M2 and verify fallback
kubectl delete pod -l app=m2-ml-engine -n staging && \
  pytest tests/chaos/test_m2_fallback.py -v

# Network partition simulation
pumba netem --duration 60s loss --percent 100 m1-container
```

### Security Audit (Layer 6)
```bash
# OWASP ZAP scan
zap-cli quick-scan --self-contained -t https://staging.nirantar.gov.in

# PII leak check in logs
grep -rn 'Aadhaar\|[0-9]\{4\}-[0-9]\{4\}-[0-9]\{4\}' logs/ && exit 1 || echo "PASS"
```

### Accessibility Audit (Layer 7)
```bash
# axe-core automated scan
npx axe-cli https://staging.nirantar.gov.in --exit --tags wcag2aa
```

---

## 3. Success Criteria

| Layer                | Metric                            | Pass Threshold       |
|----------------------|-----------------------------------|----------------------|
| L1 — Unit            | Code coverage                     | ≥ 80%                |
| L2 — Integration     | Contract schema compliance        | 100%                 |
| L3 — ML Validation   | Intent classification F1          | ≥ 0.85               |
| L3 — ML Validation   | Feature drift PSI                 | < 0.2                |
| L4 — Load            | p99 latency at 100K users         | < 500 ms             |
| L4 — Load            | Error rate under load             | < 0.1%               |
| L5 — Chaos           | Fallback activation time          | < 5 s                |
| L5 — Chaos           | Data loss during fault            | 0 records            |
| L6 — Security        | Critical vulnerabilities          | 0                    |
| L6 — Security        | PII leaks in logs                 | 0                    |
| L7 — Accessibility   | WCAG 2.1 AA critical violations   | 0                    |
| L7 — Accessibility   | Voice WER                         | ≤ 15%                |
| L8 — E2E             | All 5 scenarios pass              | 5 / 5                |

---

## 4. CI/CD Integration

Mapping verification layers to the 9-stage pipeline defined in `cicd_pipeline.md`:

| Pipeline Stage          | Verification Layer(s)         | Gate Type     |
|-------------------------|-------------------------------|---------------|
| 1 — Lint & Format       | —                             | Hard gate     |
| 2 — Unit Test           | **L1** Unit Tests             | Hard gate     |
| 3 — Build               | —                             | Hard gate     |
| 4 — Integration Test    | **L2** Integration / Contract | Hard gate     |
| 5 — Security Scan       | **L6** Security Audit         | Hard gate     |
| 6 — Deploy to Staging   | —                             | Auto          |
| 7 — Staging Validation  | **L3** ML, **L4** Load, **L5** Chaos, **L7** A11y | Hard gate |
| 8 — E2E Smoke           | **L8** End-to-End Scenarios   | Hard gate     |
| 9 — Promote to Prod     | All layers green              | Manual + Auto |

> **Rule:** No artifact advances past a hard gate unless the mapped verification layer reports **PASS**. SENTINEL holds the gate key at every stage.

---

*SENTINEL signs off on production readiness only when all 8 layers report PASS and the CI/CD pipeline is fully green.*
