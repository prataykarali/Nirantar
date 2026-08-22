"""8.3 Security metrics against persona ground truth."""

from __future__ import annotations

from typing import Iterable, List

from contracts.experiment import SecurityEvalMetrics
from contracts.simulation import CitizenOutcome, PersonaKind


def from_outcomes(outcomes: Iterable[CitizenOutcome]) -> SecurityEvalMetrics:
    rows: List[CitizenOutcome] = list(outcomes)
    tp = fp = tn = fn = 0
    detect_latencies: List[float] = []
    for o in rows:
        is_bad = o.persona == PersonaKind.SUSPICIOUS
        flagged = o.throttled or o.outcome in {"throttled", "dropped"}
        if is_bad and flagged:
            tp += 1
            detect_latencies.append(max(0.05, o.steps_completed * 0.05))
        elif is_bad and not flagged:
            fn += 1
        elif (not is_bad) and flagged:
            fp += 1
        else:
            tn += 1
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = 0.0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)
    det = sum(detect_latencies) / len(detect_latencies) if detect_latencies else 0.0
    return SecurityEvalMetrics(
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1=round(f1, 4),
        false_positives=fp,
        false_negatives=fn,
        true_positives=tp,
        true_negatives=tn,
        detection_latency_s=round(det, 4),
    )
