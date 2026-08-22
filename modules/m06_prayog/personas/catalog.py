"""Persona mix for a 10,000 virtual-citizen population."""

from __future__ import annotations

from typing import Dict, List, Tuple

from contracts.simulation import DeviceType, JourneyStep, PersonaKind

DEFAULT_MIX_10K: Dict[PersonaKind, int] = {
    PersonaKind.NORMAL: 5500,
    PersonaKind.SEARCH_HEAVY: 1500,
    PersonaKind.RETURNING: 1000,
    PersonaKind.SLOW_MOBILE: 800,
    PersonaKind.RETRY_HEAVY: 500,
    PersonaKind.SUSPICIOUS: 500,
    PersonaKind.ABANDONED: 200,
}

DEMOGRAPHIC_MIX_10K: Dict[PersonaKind, int] = {
    PersonaKind.RURAL: 3500,
    PersonaKind.TATKAL_RUSH: 3000,
    PersonaKind.COMMUTER: 2000,
    PersonaKind.BOT_SCALPER: 1500,
}

BOOKING_JOURNEY: List[JourneyStep] = [
    JourneyStep.OPEN,
    JourneyStep.SEARCH,
    JourneyStep.THINK,
    JourneyStep.RESULTS,
    JourneyStep.SELECT,
    JourneyStep.AUTHENTICATE,
    JourneyStep.BOOK,
    JourneyStep.PAYMENT,
    JourneyStep.CONFIRMATION,
]

PERSONA_SPECS: Dict[PersonaKind, Dict[str, object]] = {
    PersonaKind.NORMAL: {
        "intent": "BOOK_TRAIN",
        "think": (1.2, 3.0),
        "session": (70.0, 160.0),
        "device": DeviceType.DESKTOP,
        "journey": list(BOOKING_JOURNEY),
    },
    PersonaKind.SEARCH_HEAVY: {
        "intent": "SEARCH_TRAINS",
        "think": (0.3, 1.0),
        "session": (50.0, 120.0),
        "device": DeviceType.DESKTOP,
        "journey": [
            JourneyStep.OPEN,
            JourneyStep.SEARCH,
            JourneyStep.SEARCH,
            JourneyStep.SEARCH,
            JourneyStep.RESULTS,
            JourneyStep.SELECT,
        ],
    },
    PersonaKind.RETURNING: {
        "intent": "BOOK_TRAIN",
        "think": (0.6, 1.4),
        "session": (40.0, 90.0),
        "device": DeviceType.DESKTOP,
        "journey": [
            JourneyStep.OPEN,
            JourneyStep.SEARCH,
            JourneyStep.SELECT,
            JourneyStep.AUTHENTICATE,
            JourneyStep.BOOK,
            JourneyStep.PAYMENT,
            JourneyStep.CONFIRMATION,
        ],
    },
    PersonaKind.SLOW_MOBILE: {
        "intent": "BOOK_TRAIN",
        "think": (4.0, 9.0),
        "session": (180.0, 400.0),
        "device": DeviceType.MOBILE,
        "journey": list(BOOKING_JOURNEY),
    },
    PersonaKind.RETRY_HEAVY: {
        "intent": "BOOK_TRAIN",
        "think": (0.3, 0.9),
        "session": (80.0, 200.0),
        "device": DeviceType.DESKTOP,
        "journey": [
            JourneyStep.OPEN,
            JourneyStep.SEARCH,
            JourneyStep.RESULTS,
            JourneyStep.SELECT,
            JourneyStep.BOOK,
            JourneyStep.BOOK,
            JourneyStep.BOOK,
            JourneyStep.PAYMENT,
            JourneyStep.CONFIRMATION,
        ],
    },
    PersonaKind.SUSPICIOUS: {
        "intent": "CHECK_AVAILABILITY",
        "think": (0.05, 0.2),
        "session": (8.0, 25.0),
        "device": DeviceType.DESKTOP,
        "journey": [JourneyStep.SEARCH] * 8 + [JourneyStep.BOOK],
    },
    PersonaKind.ABANDONED: {
        "intent": "SEARCH_TRAINS",
        "think": (2.0, 6.0),
        "session": (12.0, 40.0),
        "device": DeviceType.MOBILE,
        "journey": [
            JourneyStep.OPEN,
            JourneyStep.SEARCH,
            JourneyStep.RESULTS,
            JourneyStep.ABANDON,
        ],
    },
    PersonaKind.RURAL: {
        "intent": "BOOK_TRAIN",
        "think": (3.0, 7.0),
        "session": (150.0, 300.0),
        "device": DeviceType.FEATURE_PHONE,
        "journey": list(BOOKING_JOURNEY),
    },
    PersonaKind.TATKAL_RUSH: {
        "intent": "TATKAL_BOOKING",
        "think": (0.2, 0.8),
        "session": (30.0, 90.0),
        "device": DeviceType.DESKTOP,
        "journey": [
            JourneyStep.OPEN,
            JourneyStep.SEARCH,
            JourneyStep.SELECT,
            JourneyStep.AUTHENTICATE,
            JourneyStep.BOOK,
            JourneyStep.PAYMENT,
            JourneyStep.CONFIRMATION,
        ],
    },
    PersonaKind.COMMUTER: {
        "intent": "DAILY_COMMUTE",
        "think": (0.8, 2.0),
        "session": (45.0, 110.0),
        "device": DeviceType.MOBILE,
        "journey": list(BOOKING_JOURNEY),
    },
    PersonaKind.BOT_SCALPER: {
        "intent": "SCRAPE_AND_HOARD",
        "think": (0.01, 0.1),
        "session": (5.0, 15.0),
        "device": DeviceType.DESKTOP,
        "journey": [JourneyStep.SEARCH] * 10 + [JourneyStep.BOOK] * 3,
    },
}

LOCUST_WEIGHTS: Dict[PersonaKind, int] = {
    kind: count // 100 for kind, count in DEFAULT_MIX_10K.items()
}


def scaled_mix(total: int, mix: Dict[PersonaKind, int] | None = None) -> Dict[PersonaKind, int]:
    """Scale a mix so the counts sum exactly to `total`."""
    source = mix or DEFAULT_MIX_10K
    base = sum(source.values()) or 1
    raw: List[Tuple[PersonaKind, float]] = [
        (kind, (count / base) * total) for kind, count in source.items()
    ]
    counts = {kind: int(value) for kind, value in raw}
    remainder = total - sum(counts.values())
    leftovers = sorted(raw, key=lambda item: item[1] - int(item[1]), reverse=True)
    for i in range(remainder):
        counts[leftovers[i % len(leftovers)][0]] += 1
    return counts


def legit_plus_suspicious(total: int, suspicious: int) -> Dict[PersonaKind, int]:
    """Scenario E mix: N legitimate + M suspicious."""
    legit_total = max(0, total - suspicious)
    legit_source = {
        kind: count
        for kind, count in DEFAULT_MIX_10K.items()
        if kind != PersonaKind.SUSPICIOUS
    }
    mix = scaled_mix(legit_total, legit_source)
    mix[PersonaKind.SUSPICIOUS] = suspicious
    return mix
