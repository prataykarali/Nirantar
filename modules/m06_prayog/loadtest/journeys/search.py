"""
NIRANTAR Load Test — Citizen User Journeys (Search & Booking)
=============================================================
Defines realistic citizen interaction patterns for Locust load simulation.
"""

from typing import Any, Dict, List
import random


class CitizenJourneys:
    """Reusable user behavior tasks for Locust virtual users."""

    SAMPLE_ROUTES = [
        ("HWH", "NDLS"),
        ("BCT", "NDLS"),
        ("NDLS", "LKO"),
        ("NDLS", "BSB"),
        ("NDLS", "MAS"),
    ]

    TRAINS = ["12301", "12951", "12004", "22436", "12626"]
    CLASSES = ["1A", "2A", "3A", "SL"]
    QUOTAS = ["GN", "TQ"]

    @classmethod
    def random_search_payload(cls) -> Dict[str, str]:
        src, dst = random.choice(cls.SAMPLE_ROUTES)
        return {"source": src, "destination": dst}

    @classmethod
    def random_availability_payload(cls) -> Dict[str, str]:
        return {
            "train_no": random.choice(cls.TRAINS),
            "travel_date": "2026-08-22",
            "class_type": random.choice(cls.CLASSES),
            "quota": random.choice(cls.QUOTAS),
        }

    @classmethod
    def random_booking_payload(cls) -> Dict[str, Any]:
        src, dst = random.choice(cls.SAMPLE_ROUTES)
        return {
            "citizen_id": f"CIT-{random.randint(100, 999)}",
            "train_no": random.choice(cls.TRAINS),
            "travel_date": "2026-08-22",
            "class_type": random.choice(cls.CLASSES),
            "quota": random.choice(cls.QUOTAS),
            "source": src,
            "destination": dst,
            "passengers": [
                {"name": f"P{random.randint(1, 99)}***", "age": random.randint(18, 65), "gender": "M"}
            ],
        }
