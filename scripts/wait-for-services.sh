#!/usr/bin/env bash

# Wait until all docker compose services are running/healthy.
# Usage: ./scripts/wait-for-services.sh [local|prod]
# Optional env vars:
#   WAIT_TIMEOUT  - max seconds to wait (default: 300)
#   WAIT_INTERVAL - polling interval seconds (default: 5)

set -euo pipefail

PROFILE="${1:-local}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"
WAIT_INTERVAL="${WAIT_INTERVAL:-5}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILES=(-f docker-compose.yml)
case "$PROFILE" in
  local)
    COMPOSE_FILES+=(-f docker-compose.local.yml)
    ;;
  prod|production)
    COMPOSE_FILES+=(-f docker-compose.prod.yml)
    ;;
  *)
    echo "Unknown profile: ${PROFILE}. Use 'local' or 'prod'."
    exit 1
    ;;
esac

echo "Waiting for services (${PROFILE}) to be ready (timeout: ${WAIT_TIMEOUT}s)..."

START_TIME=$(date +%s)

while true; do
  mapfile -t STATUSES < <(docker compose "${COMPOSE_FILES[@]}" ps --format '{{.Service}} {{.Status}}')

  if ((${#STATUSES[@]} == 0)); then
    echo "No containers found for profile '${PROFILE}'. Did you run docker compose up?"
    exit 1
  fi

  NOT_READY=()
  for LINE in "${STATUSES[@]}"; do
    SERVICE="${LINE%% *}"
    STATUS="${LINE#* }"

    # Treat any non-running status (starting, exited, restarting, etc.) as not ready.
    if [[ ! "${STATUS}" =~ ^running ]]; then
      NOT_READY+=("${SERVICE}:${STATUS}")
    fi
  done

  if ((${#NOT_READY[@]} == 0)); then
    echo "All services are running."
    exit 0
  fi

  ELAPSED=$(( $(date +%s) - START_TIME ))
  if (( ELAPSED >= WAIT_TIMEOUT )); then
    echo "Timed out after ${WAIT_TIMEOUT}s. Still waiting for: ${NOT_READY[*]}"
    exit 1
  fi

  echo "Waiting (${#NOT_READY[@]} not ready): ${NOT_READY[*]}"
  sleep "${WAIT_INTERVAL}"
done

