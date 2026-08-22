# 🚀 NIRANTAR Production Deployment & Containerization Guide

Instructions for deploying NIRANTAR on bare-metal, Kubernetes, or air-gapped secure edge environments.

---

## 1. Local / Air-Gapped Deployment

NIRANTAR requires zero external cloud connections to function:

```bash
# 1. Start backend gateway
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# 2. Serve static frontend bundle
cd frontend && npm run preview -- --port 5173
```

---

## 2. Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `NIRANTAR_ENV` | `production` | Runtime mode (`development` / `production`) |
| `LOCAL_DB_PATH` | `data/nirantar.db` | Local SQLite database persistence file |
| `KAVACH_RATE_LIMIT_RPS` | `10.0` | Base citizen RPS capacity threshold |
| `DHARA_SELF_HEALING` | `true` | Enable autonomous load shedding |
