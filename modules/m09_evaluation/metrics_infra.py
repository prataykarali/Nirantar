"""8.2 Infrastructure metrics from digital-twin telemetry."""

from __future__ import annotations

from typing import Any, Dict, List

from contracts.experiment import InfraMetrics


def from_service_rows(rows: List[Dict[str, Any]]) -> InfraMetrics:
    """Aggregate p50/p99 (and a p95 stand-in) across emitted service snapshots."""
    if not rows:
        return InfraMetrics()
    p50 = [float(r.get("latency_p50_ms") or 0.0) for r in rows]
    p99 = [float(r.get("latency_p99_ms") or 0.0) for r in rows]
    tput = [float(r.get("throughput_rps") or 0.0) for r in rows]
    err = [float(r.get("error_rate") or 0.0) for r in rows]
    cpu = [float(r.get("cpu_percent") or 0.0) for r in rows]
    ram = [float(r.get("ram_percent") or 0.0) for r in rows]
    db_rows = [r for r in rows if "DB" in str(r.get("service_name") or "")]
    db_cpu = [float(r.get("cpu_percent") or 0.0) for r in db_rows] or cpu
    p95 = [(a + b) / 2.0 for a, b in zip(p50, p99)]
    return InfraMetrics(
        p50_latency_ms=round(sum(p50) / len(p50), 2),
        p95_latency_ms=round(sum(p95) / len(p95), 2),
        p99_latency_ms=round(max(p99), 2),
        throughput_rps=round(sum(tput), 2),
        error_rate=round(sum(err) / len(err), 4),
        cpu_percent=round(sum(cpu) / len(cpu), 2),
        ram_percent=round(sum(ram) / len(ram), 2),
        db_utilization=round(sum(db_cpu) / len(db_cpu), 2),
    )


def from_router(router: Any) -> InfraMetrics:
    raw = router.handle_request("GET", "/api/v0/telemetry/snapshot")
    rows = raw.get("data") or []
    return from_service_rows(rows)
