# NIRANTAR — Module 5: DHARA (Decide)

> Canonical numbering is in `docs/architecture/system.md`. Dhara is **Module 5 — Decide**. PortalPulse predicts. Kavach detects. Dhara decides.

## DSA + Resilience Orchestrator

**Job:** Take PortalPulse predictions and Kavach trust signals, then decide queues, shedding, and inventory protection.

### 4.1 Service Dependency Graph

The entire mock backend is represented as a directed graph:

```
          Booking
         /   |   \
        /    |    \
       ↓     ↓     ↓
    Auth   Inventory  Payment
     │        │        │
     ↓        ↓        ↓
Citizen     DB         DB
```

**Nodes:** services, databases, APIs, queues, caches  
**Edges:** dependencies, blast radius

### 4.2 Critical-Path Analysis

DHARA knows which services are critical:

- Inventory DB = critical (booking cannot proceed without it)
- Payment = critical
- Auth = critical
- Non-critical = search analytics, notifications, etc.

When Inventory is down, DHARA immediately protects it and sheds non-critical workloads.

### 4.3 Queue Management

When demand > capacity:

Instead of crashing:
- Activate virtual queue
- Safe admission rate control
- Priority admission

### 4.4 Priority Queues

Different request categories get different priorities:

| Category          | Priority | Example |
|-------------------|----------|---------|
| Critical booking  | Highest   | Book train |
| Normal transaction| High      | Check status |
| Search            | Medium    | Availability check |
| Analytics         | Low       | Background stats |
| Background work   | Lowest    | Notifications |

### 4.5 Load Shedding

When overloaded:

**Protect these first:**
- Authentication
- Inventory
- Booking
- Payment

**Defer / stop:**
- Non-critical refreshes
- Analytics
- Background work

### 4.6 Dynamic Rate Control

DHARA continuously adjusts:
- Allowed requests/sec
- Queue admission rate
- Service priority
- Based on NOVA predictions + KAVACH signals

### 4.7 Graph Algorithms (DSA)

DHARA uses:
- **BFS / DFS** — service dependency traversal
- **Dijkstra** — lowest-cost / lowest-risk path
- **Topological sort** — resolve execution order
- **Priority queue** — request prioritization
- **Sliding window** — traffic rate analysis
- **Hash maps** — fast session/service lookup
- **Heap** — dynamic priority scheduling

### 4.8 Optimization Loop

The closed intelligence loop:

```
NOVA (Predict):
  Overload probability = 87%

KAVACH (Trust):
  1,100 suspicious sessions

DHARA (Decide):
  Activate queue
  Throttle suspicious traffic
  Protect inventory DB
  Disable non-critical workloads
```

**Result:** The system self-heals and stays stable at 5K–10K VUs.

---

**Integration points:**

- Receives signals from PORTALPULSE (predict) and KAVACH (trust)
- Issues actions back to mock services (queue, shed, rate limit)
- Feeds telemetry back to Predict + Trust planes
- Works with the 1K → 5K → 10K VU ladder
