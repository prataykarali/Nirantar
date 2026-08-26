# ═══════════════════════════════════════════════════════════════════
# NIRANTAR — Production Multi-Stage Dockerfile
# Lightweight, hardened container image (< 100MB footprint)
# ═══════════════════════════════════════════════════════════════════

# Stage 1: Build Frontend Single-Page App
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend Runtime Image
FROM python:3.11-slim AS production
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app

# Install system utilities and clean up cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code, digital twin, modules, contracts, and project config
COPY backend/ ./backend/
COPY m0_digital_twin/ ./m0_digital_twin/
COPY modules/ ./modules/
COPY contracts/ ./contracts/
COPY pyproject.toml ./
COPY alembic.ini ./
COPY alembic ./alembic

# Create alias symlinks for cross-module and legacy imports inside container
RUN ln -sf /app/modules/m06_prayog /app/simulation && \
    ln -sf /app/modules/m06_prayog /app/m6_prayog && \
    ln -sf /app/modules/m03_portalpulse/ml /app/ml && \
    ln -sf /app/modules/m05_dhara /app/orchestrator && \
    ln -sf /app/modules/m04_kavach /app/security && \
    ln -sf /app/modules/m08_cairo_trust /app/cairo && \
    ln -sf /app/modules/m06_prayog/loadtest /app/loadtest && \
    ln -sf /app/modules/m01_citizen_ux/python /app/backend/app/services/citizen && \
    ln -sf /app/modules/m07_command_center/python /app/backend/app/services/command_center && \
    ln -sf /app/modules/m03_portalpulse/python /app/backend/app/services/prediction && \
    ln -sf /app/modules/m02_workflow_engine/python /app/backend/app/services/workflow

# Copy built frontend assets for serving via FastAPI static mounts
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Cloud Run sets PORT (often 8080); honor it so the health check can reach the app.
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
