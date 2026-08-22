# NIRANTAR — Module 4: KAVACH (Detect)

> Canonical numbering is in `docs/architecture/system.md`. Kavach is **Module 4 — Detect**, not Module 3.

## Security, Trust & Privacy (Mental Model)

**Job:** Adaptive trust layer under the mock railway backend. Not DDoS-only.

### 3.1 Behaviour Profiling

Every virtual user is profiled by:

- Request frequency per minute
- Endpoint sequence (Navigation path)
- Session duration
- Retry frequency
- Navigation pattern

**Example profiles:**

| Profile   | Behaviour Pattern                              | Risk Level |
|-----------|-----------------------------------------------|------------|
| Human     | Home → Search → Results → Select → Book       | Low        |
| Bot-like  | Search → Search → Search → Search → Search    | High       |
| Scalper   | Rapid availability checks + booking attempts   | Critical   |

### 3.2 Traffic Classification

```
Incoming traffic
         │
         ▼
      KAVACH
         │
 ┌───────┼───────┐
 ▼       ▼       ▼
Normal  Suspicious  Anomaly
```

### 3.3 Risk Scoring

Every session receives a continuous risk score (0.0 – 1.0):

- `risk_score = 0.12` → Low
- `risk_score = 0.91` → High

### 3.4 Adaptive Response (Critical Rule)

**Never auto-block.** Adaptive thresholds:

| Risk Score | Action                              | Purpose |
|------------|-------------------------------------|---------|
| < 0.3      | Allow                                | Normal citizen |
| 0.3–0.6    | Monitor & log                        | Suspicious |
| 0.6–0.8    | Rate limit + CAPTCHA + challenge     | Abnormal |
| > 0.8      | Throttle / block / isolate            | Malicious / scalper |

**This is the heart of the module:** A system that accidentally blocks legitimate citizens is itself a failure.

### 3.5 Rate Limiting

- Normal user: **10 requests/sec**
- Suspicious session: **2 requests/sec**
- Bot-like: **0.5 requests/sec**

### 3.6 Database Protection

KAVACH + DHARA together prevent the mock database from being overwhelmed by:

- Inventory DB overload
- Booking queue saturation
- Credential abuse

### 3.7 Privacy & Trust Primitive

**Non-negotiable requirements:**

- Zero real government citizen database
- All data is synthetic/mock (m0_digital_twin)
- PII minimization (already in contracts)
- Access control (JWT + RBAC)
- Audit logging
- Cairo STARK proof for narrow verifiable telemetry batches (ADR-003)

**Design rule:** No live sensitive infrastructure is touched. The research explicitly requires synthetic/mock data.

### 3.8 Security Testing

KAVACH generates controlled attacks for testing:

- Burst traffic
- Repeated requests
- Credential abuse simulation
- Endpoint enumeration
- Abnormal session patterns

All of it is contained in the test environment.

---

**Integration with other modules:**

- **NOVA (Predict)** feeds demand forecasts
- **DHARA (Decide)** consumes trust scores for queue/admission decisions
- **Citizen Experience** receives appropriate responses (allow / challenge / block messages)
- Telemetry flows back to Predict + Trust planes
