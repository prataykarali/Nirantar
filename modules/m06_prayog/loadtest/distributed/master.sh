#!/usr/bin/env bash
# PRAYOG distributed master. Workers on other laptops join this process.
# Example 10k split: 5 workers × 2,000 VUs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
HOST="${HOST:-http://localhost:8000}"
WORKERS="${WORKERS:-4}"
exec locust -f loadtest/locustfile.py --master --expect-workers="$WORKERS" --host="$HOST" "$@"
