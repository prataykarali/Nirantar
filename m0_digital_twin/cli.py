"""
NIRANTAR Module 0 — Digital Twin CLI Runner
===========================================
Interactive command-line tool to inspect stations, search trains,
check dynamic quotas, simulate failure blast radius, and emit real-time telemetry.

Usage:
    python -m m0_digital_twin.cli --stations
    python -m m0_digital_twin.cli --search --src HWH --dst NDLS
    python -m m0_digital_twin.cli --telemetry --scenario TATKAL_RUSH --ticks 5
    python -m m0_digital_twin.cli --failure SeatInventoryDB
"""

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from .database import get_db
from .dependency_graph import default_service_graph
from .mock_services import SearchService, AvailabilityService
from .telemetry_emitter import TelemetryEmitter, SimulationScenario


def main() -> None:
    parser = argparse.ArgumentParser(description="NIRANTAR Module 0 — Digital Twin CLI")
    parser.add_argument("--stations", action="store_true", help="List all indexed railway stations")
    parser.add_argument("--search", action="store_true", help="Search trains between stations")
    parser.add_argument("--src", type=str, default="HWH", help="Source station code (default: HWH)")
    parser.add_argument("--dst", type=str, default="NDLS", help="Destination station code (default: NDLS)")
    parser.add_argument("--availability", action="store_true", help="Check seat availability")
    parser.add_argument("--train", type=str, default="12301", help="Train number")
    parser.add_argument("--quota", type=str, default="GN", help="Quota: GN, TQ, PT")
    parser.add_argument("--telemetry", action="store_true", help="Emit synthetic telemetry stream")
    parser.add_argument("--scenario", type=str, default="NORMAL_DAYTIME", help="IDLE, NORMAL_DAYTIME, TATKAL_RUSH, BOT_ATTACK, BACKEND_FAILURE")
    parser.add_argument("--ticks", type=int, default=3, help="Number of telemetry snapshot ticks")
    parser.add_argument("--failure", type=str, help="Simulate outage of a microservice and calculate blast radius")
    parser.add_argument("--mermaid", action="store_true", help="Output Mermaid diagram of service dependency graph")

    args = parser.parse_args()
    db = get_db()

    if args.stations:
        search = SearchService(db)
        stations = search.list_stations()
        sys.stdout.write(f"\n🚉 Indexed Stations ({len(stations)} hubs):\n")
        for s in stations:
            sys.stdout.write(f"  • [{s['code']}] {s['name']} — {s['state']} ({s['zone']})\n")
        return

    if args.search:
        search = SearchService(db)
        trains = search.search_routes(args.src, args.dst)
        sys.stdout.write(f"\n🚆 Trains connecting {args.src} ➔ {args.dst} ({len(trains)} found):\n")
        for t in trains:
            sys.stdout.write(f"  • Train #{t['train_no']}: {t['train_name']} ({t['train_type']})\n")
        return

    if args.availability:
        avail = AvailabilityService(db)
        dt = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
        res = avail.check_availability(args.train, dt, "3A", args.quota)
        sys.stdout.write(f"\n🎫 Availability for Train #{args.train} on {dt} [Class 3A, Quota {args.quota}]:\n")
        sys.stdout.write(f"  • Status: {res['status']} ({res['available_seats']}/{res['total_capacity']} seats)\n")
        sys.stdout.write(f"  • Fare: ₹{res['fare_inr']}\n")
        return

    if args.failure:
        graph = default_service_graph()
        sim = graph.simulate_failure(args.failure)
        sys.stdout.write(f"\n💥 Outage Blast Radius Simulation for [{args.failure}]:\n")
        sys.stdout.write(f"  • Impacted Downstream Services: {sim['affected_downstream']}\n")
        sys.stdout.write(f"  • Unaffected Services: {sim['unaffected_services']}\n")
        sys.stdout.write(f"  • System Health Index: {sim['system_health_index'] * 100}%\n")
        return

    if args.mermaid:
        graph = default_service_graph()
        sys.stdout.write("\n```mermaid\n" + graph.to_mermaid() + "\n```\n")
        return

    if args.telemetry:
        emitter = TelemetryEmitter(db)
        scen = SimulationScenario(args.scenario)
        emitter.set_scenario(scen)
        sys.stdout.write(f"\n📡 Streaming Telemetry (Scenario: {scen.value}, Ticks: {args.ticks}):\n")
        for snapshot in emitter.stream_telemetry(ticks=args.ticks, interval_sec=0.0):
            sys.stdout.write(f"--- Snapshot at {snapshot[0].timestamp} ---\n")
            for m in snapshot:
                sys.stdout.write(f"  [{m.service_name:20}] RPS: {m.requests_per_sec:8.1f} | CPU: {m.cpu_percent:5.1f}% | Latency p99: {m.latency_p99_ms:7.1f}ms | Error: {m.error_rate * 100:5.1f}%\n")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
