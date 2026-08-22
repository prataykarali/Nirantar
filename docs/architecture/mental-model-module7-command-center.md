# NIRANTAR — Module 7: Command Center

> Canonical numbering is in `docs/architecture/system.md`. The Command Center is the **operator surface**. It observes the same mock railway state the citizen path produces.

## Not a generic dashboard

The screen is the control loop:

PortalPulse predicts → Kavach detects → Dhara decides → PRAYOG stresses → operator sees the result.

### 7.1 Live system state

Concurrent users, requests/sec, CPU, latency, error rate.

### 7.2 Forecast

Current, +5 min, +10 min, safe capacity. If demand will cross the ceiling: **OVERLOAD PREDICTED IN N SECONDS**.

### 7.3 Security

Legitimate / suspicious / blocked / throttled — Kavach counts, scaled to the live user total.

### 7.4 Dependency graph

AUTH → BOOKING → {DB, PAYMENT} with health dots. When SeatInventoryDB degrades: **Inventory DB is the bottleneck.**

### 7.5 Recommended actions

Dhara's five levers, ticked only when actually decided:

- Activate virtual queue
- Protect Inventory DB
- Throttle suspicious sessions
- Enable caching
- Defer non-critical requests

### 7.6 Intervention timeline

A short, timestamped loop: spike → anomaly → overload predicted → queue → throttle → stabilize.
