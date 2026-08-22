"""
NIRANTAR Module 0 — Service Dependency Graph
============================================
Topological model of public-service microservices and backend databases.
Enables upstream dependency tracing, downstream impact analysis, failure propagation,
and critical path evaluation for resilient journey orchestration.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Set, Tuple


@dataclass
class ServiceNode:
    """A node in the microservice topology."""
    name: str
    service_type: str  # API, DATABASE, GATEWAY, EXTERNAL
    is_critical: bool = True
    base_latency_ms: float = 20.0
    sla_p99_ms: float = 250.0
    health: float = 1.0  # 1.0 = healthy, 0.0 = offline


class ServiceDependencyGraph:
    """Service Graph topology with critical path and failure propagation analysis."""

    def __init__(self) -> None:
        self.nodes: Dict[str, ServiceNode] = {}
        # edges: node -> set of upstream dependencies it directly relies upon
        self.dependencies: Dict[str, Set[str]] = {}
        # reverse_edges: node -> set of downstream services that rely on it
        self.dependents: Dict[str, Set[str]] = {}

    def add_service(
        self,
        name: str,
        service_type: str = "API",
        is_critical: bool = True,
        base_latency_ms: float = 20.0,
    ) -> None:
        """Register a service node in the topology."""
        self.nodes[name] = ServiceNode(
            name=name,
            service_type=service_type,
            is_critical=is_critical,
            base_latency_ms=base_latency_ms,
        )
        if name not in self.dependencies:
            self.dependencies[name] = set()
        if name not in self.dependents:
            self.dependents[name] = set()

    def add_dependency(self, service: str, depends_on: str) -> None:
        """Declare that `service` requires `depends_on` to function."""
        if service not in self.nodes:
            self.add_service(service)
        if depends_on not in self.nodes:
            self.add_service(depends_on)

        self.dependencies[service].add(depends_on)
        self.dependents[depends_on].add(service)

    def get_upstream(self, service: str, recursive: bool = True) -> Set[str]:
        """Find all upstream dependencies required by this service."""
        if service not in self.dependencies:
            return set()
        if not recursive:
            return set(self.dependencies[service])

        visited: Set[str] = set()
        queue = list(self.dependencies[service])
        while queue:
            curr = queue.pop(0)
            if curr in visited:
                continue
            visited.add(curr)
            queue.extend(self.dependencies.get(curr, set()))
        return visited

    def get_downstream(self, service: str, recursive: bool = True) -> Set[str]:
        """Find all downstream services affected if `service` degrades or fails."""
        if service not in self.dependents:
            return set()
        if not recursive:
            return set(self.dependents[service])

        visited: Set[str] = set()
        queue = list(self.dependents[service])
        while queue:
            curr = queue.pop(0)
            if curr in visited:
                continue
            visited.add(curr)
            queue.extend(self.dependents.get(curr, set()))
        return visited

    def simulate_failure(self, failed_service: str) -> Dict[str, Any]:
        """Simulate the blast radius of a microservice outage."""
        if failed_service not in self.nodes:
            return {
                "failed_service": failed_service,
                "status": "UNKNOWN_SERVICE",
                "affected_downstream": [],
                "unaffected_services": list(self.nodes.keys()),
                "system_health": 1.0,
            }

        affected = self.get_downstream(failed_service, recursive=True)
        affected_with_self = affected | {failed_service}
        unaffected = set(self.nodes.keys()) - affected_with_self

        total_nodes = len(self.nodes)
        health_ratio = len(unaffected) / total_nodes if total_nodes > 0 else 0.0

        return {
            "failed_service": failed_service,
            "blast_radius_count": len(affected_with_self),
            "affected_downstream": sorted(list(affected)),
            "unaffected_services": sorted(list(unaffected)),
            "system_health_index": round(health_ratio, 3),
        }

    def compute_critical_path(self, target_service: str) -> Dict[str, Any]:
        """Compute the critical latency path to fulfill target_service."""
        if target_service not in self.nodes:
            return {"service": target_service, "critical_path": [], "estimated_latency_ms": 0.0}

        def calculate_path(curr: str) -> Tuple[float, List[str]]:
            node = self.nodes[curr]
            deps = self.dependencies.get(curr, set())
            if not deps:
                return node.base_latency_ms, [curr]

            max_dep_latency = 0.0
            longest_subpath: List[str] = []
            for dep in deps:
                sub_lat, sub_path = calculate_path(dep)
                if sub_lat > max_dep_latency:
                    max_dep_latency = sub_lat
                    longest_subpath = sub_path

            return node.base_latency_ms + max_dep_latency, [curr] + longest_subpath

        total_lat, path = calculate_path(target_service)
        return {
            "target_service": target_service,
            "critical_path": path,
            "estimated_latency_ms": round(total_lat, 2),
        }

    def to_mermaid(self) -> str:
        """Export topology as a Mermaid DAG diagram."""
        lines = ["graph TD"]
        for svc, deps in self.dependencies.items():
            for dep in deps:
                lines.append(f"    {svc}[\"{svc}\"] --> {dep}[\"{dep}\"]")
        return "\n".join(lines)


def default_service_graph() -> ServiceDependencyGraph:
    """Factory creating the default NIRANTAR Public Service Dependency Graph."""
    g = ServiceDependencyGraph()

    # Define nodes
    g.add_service("CitizenPortal_M1", "UI", True, 15.0)
    g.add_service("BookingEngine", "API", True, 45.0)
    g.add_service("SearchService", "API", False, 10.0)
    g.add_service("AvailabilityService", "API", True, 20.0)
    g.add_service("AuthService", "SECURITY", True, 25.0)
    g.add_service("PassengerDB", "DATABASE", True, 30.0)
    g.add_service("SeatInventoryDB", "DATABASE", True, 20.0)
    g.add_service("PaymentGateway", "EXTERNAL", True, 120.0)
    g.add_service("NotificationDispatcher", "API", False, 50.0)
    g.add_service("DigiLockerMock", "EXTERNAL", False, 80.0)

    # Define edges (A depends on B)
    g.add_dependency("CitizenPortal_M1", "SearchService")
    g.add_dependency("CitizenPortal_M1", "AvailabilityService")
    g.add_dependency("CitizenPortal_M1", "BookingEngine")

    g.add_dependency("SearchService", "PassengerDB")
    g.add_dependency("AvailabilityService", "SeatInventoryDB")

    g.add_dependency("BookingEngine", "AuthService")
    g.add_dependency("BookingEngine", "PassengerDB")
    g.add_dependency("BookingEngine", "SeatInventoryDB")
    g.add_dependency("BookingEngine", "PaymentGateway")
    g.add_dependency("BookingEngine", "NotificationDispatcher")

    g.add_dependency("AuthService", "DigiLockerMock")

    return g
