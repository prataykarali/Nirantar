#!/usr/bin/env bash
# PRAYOG distributed worker. Point MASTER_HOST at the laptop running master.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
MASTER_HOST="${MASTER_HOST:-127.0.0.1}"
exec locust -f loadtest/locustfile.py --worker --master-host="$MASTER_HOST" "$@"
