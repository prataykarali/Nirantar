# 🛡️ KAVACH Security & Zero-PII Trust Guard Invariants

Detailed security policy, privacy boundaries, and threat mitigation rules enforced in NIRANTAR.

---

## 1. Zero-PII Safety Boundary

NIRANTAR strictly prohibits sensitive citizen credentials from entering telemetry, LLM contexts, logs, or autofill profiles:

- **Forbidden Fields:** Passwords, OTPs, CVVs, PINs, full Aadhaar (12 digits), full Card Numbers (16 digits), and raw authorization tokens.
- **Allowed Autofill Fields:** Name, Age, Gender, Berth Preference, Quota, Origin Station, Destination Station.
- **Recursive Sanitizer:** Every payload processed by `sanitize_payload()` scrubs or masks sensitive fields recursively across nested JSON structures.

---

## 2. Multi-Tier Rate Limiting Matrix

| Citizen Risk Tier | Max Allowed RPS | Burst Capacity | Challenge Action |
|---|---|---|---|
| **Legitimate Citizen (Low Risk < 0.3)** | 10.0 RPS | 15 tokens | Direct Execution |
| **Monitored / High Frequency (0.3 - 0.7)** | 2.0 RPS | 4 tokens | Lightweight Verification |
| **Suspected Scalper / Bot (> 0.8)** | 0.5 RPS | 1 token | Queue Isolation / Block |

---

## 3. Public Service Non-Denial Rule

In accordance with public-service accessibility guidelines:
> **Legitimate human citizens are never auto-blocked based on single-request anomalies. The system applies progressive rate shaping rather than hard denial of service.**
