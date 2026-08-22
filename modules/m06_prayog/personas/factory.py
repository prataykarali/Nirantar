"""Build a population of VirtualCitizen records."""

from __future__ import annotations

import random
from typing import Dict, List, Sequence

from contracts.simulation import DeviceType, PersonaKind, VirtualCitizen
from simulation.personas.catalog import DEFAULT_MIX_10K, PERSONA_SPECS, scaled_mix

LANGUAGES: Sequence[str] = ("hi", "en", "bn", "ta")
LANGUAGE_WEIGHTS: Sequence[float] = (0.45, 0.30, 0.15, 0.10)


def build_population(
    total: int,
    mix: Dict[PersonaKind, int] | None = None,
    ramp_up_s: float = 10.0,
    seed: int = 42,
) -> List[VirtualCitizen]:
    """Create `total` virtual citizens matching the persona mix."""
    rng = random.Random(seed)
    counts = mix or scaled_mix(total, DEFAULT_MIX_10K)
    citizens: List[VirtualCitizen] = []
    seq = 0
    for kind, n in counts.items():
        for _ in range(n):
            seq += 1
            citizens.append(_one(rng, kind, seq, ramp_up_s))
    rng.shuffle(citizens)
    return citizens


def _one(rng: random.Random, kind: PersonaKind, seq: int, ramp_up_s: float) -> VirtualCitizen:
    spec = PERSONA_SPECS[kind]
    think = spec["think"]
    session = spec["session"]
    device = spec["device"]
    if kind != PersonaKind.SLOW_MOBILE and rng.random() < 0.25:
        device = DeviceType.MOBILE
    return VirtualCitizen(
        user_id=f"VU-{seq:05d}",
        intent=str(spec["intent"]),
        language=rng.choices(list(LANGUAGES), weights=list(LANGUAGE_WEIGHTS), k=1)[0],
        device=device,  # type: ignore[arg-type]
        arrival_time_s=round(rng.uniform(0.0, ramp_up_s), 3),
        think_time_s=round(rng.uniform(think[0], think[1]), 3),  # type: ignore[index]
        session_duration_s=round(rng.uniform(session[0], session[1]), 3),  # type: ignore[index]
        journey=list(spec["journey"]),  # type: ignore[arg-type]
        persona=kind,
        ip_hash=f"ip_{kind.value.lower()}_{seq % 997}",
    )
