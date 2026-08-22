# NIRANTAR — Module 6: PRAYOG (Simulate)

> Canonical numbering is in `docs/architecture/system.md`. Prayog is **Module 6 — Simulate**. Chaos stays in the lab. It hits the same mock railway layer the citizen hits.

## Synthetic users + chaos

**Job:** Answer "can this handle 10,000 users?" without 10,000 humans.

### 6.1 Virtual citizens

Each virtual citizen has `user_id`, `intent`, `language`, `device`, `arrival_time`, `think_time`, `session_duration`, `journey`.

### 6.2 Personas (per 10,000)

| Count | Persona |
|------:|---------|
| 5,500 | Normal |
| 1,500 | Search-heavy |
| 1,000 | Returning |
| 800 | Slow / mobile |
| 500 | Retry-heavy |
| 500 | Suspicious |
| 200 | Abandoned sessions |

### 6.3 Locust

`loadtest/locustfile.py` maps those personas onto HttpUsers. Journeys are sequential:

Open → Search → Think → Results → Select → Authenticate → Book → Payment → Confirmation

Not `GET /` in a loop.

### 6.4 Distributed

Master + workers. Five laptops × 2,000 VUs = 10,000. Scripts live in `loadtest/distributed/`.

### 6.5 Scenarios

| Id | Name | Load |
|----|------|------|
| A | Normal | 1,000 |
| B | Peak | 5,000 |
| C | Extreme | 10,000 |
| D | Sudden spike | 500 → 2k → 5k → 10k |
| E | Bot surge | 8,000 legit + 2,000 suspicious |
| F | Infra degradation | 10,000 + DB latency ×5 |

Prove 1K before 5K before 10K.

### 6.6 Chaos

Inject CPU, network latency, database slowdown, API failure, service outage, traffic spike. Then ask: **does DHARA maintain the critical citizen journey?**

GAN/VAE scenario generation is optional and unused. Deterministic personas are enough.
