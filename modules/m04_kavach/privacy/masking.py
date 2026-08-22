"""KAVACH — PII minimization for synthetic citizen records."""


def mask_name(name: str) -> str:
    cleaned = (name or "").strip()
    if not cleaned:
        return "P****"
    parts = cleaned.split()
    masked = []
    for part in parts:
        if len(part) <= 1:
            masked.append(part + "***")
        else:
            masked.append(part[0] + "***")
    return " ".join(masked)


def mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) < 4:
        return "+91-********"
    return f"+91-******{digits[-4:]}"
