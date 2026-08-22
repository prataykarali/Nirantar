# 🧪 PRAYOG 10,000 Synthetic Citizen Engine & Chaos Suite Guide

User guide for running high-concurrency simulation scenarios and evaluating platform resilience.

---

## 1. Demographic Mix (10,000 Personas)

```
┌─────────────────────────────────────────────────────────────┐
│  35% Rural / First-Time Citizens (3,500 Virtual Users)     │
│  30% Tatkal Rush Citizens (3,000 Virtual Users)            │
│  20% Daily Commuters (2,000 Virtual Users)                 │
│  15% Bot / Scalper Storm Agents (1,500 Virtual Users)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Six Stress Scenarios (A through F)

- **Scenario A (Normal Day):** 1,000 concurrent VUs, quiet daytime traffic.
- **Scenario B (Peak Hours):** 5,000 concurrent VUs, typical morning peak.
- **Scenario C (Extreme Tatkal Surge):** 10,000 concurrent VUs, 10:00 AM booking surge.
- **Scenario D (Sudden Traffic Spike):** 500 $	o$ 2,000 $	o$ 5,000 $	o$ 10,000 step ramp.
- **Scenario E (Coordinated Bot Surge):** 8,000 legitimate VUs + 2,000 scalper bots.
- **Scenario F (Downstream Degradation):** 10,000 VUs + SeatInventoryDB 5x latency slowdown.

---

## 3. Running Scenarios via CLI

```bash
# Execute Scenario A (Normal)
python3 -c "from m6_prayog.chaos_suite import ChaosSuite; cs = ChaosSuite(); print(cs.run_scenario('A', population=100))"
```
