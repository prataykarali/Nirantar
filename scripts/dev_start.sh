#!/usr/bin/env bash
# Startup script for local NIRANTAR development environment

set -e

echo "🚀 Starting NIRANTAR Local Development Stack..."

# 1. Start FastAPI backend on port 8000
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "📡 Backend started on http://localhost:8000 (PID: $BACKEND_PID)"

# 2. Start Vite frontend on port 5173
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "🌐 Frontend started on http://localhost:5173 (PID: $FRONTEND_PID)"

echo "Press Ctrl+C to terminate both servers."
wait $BACKEND_PID $FRONTEND_PID
