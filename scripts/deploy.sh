#!/usr/bin/env bash
set -euo pipefail

# Health-gated production deploy script.
# Usage: ./scripts/deploy.sh [environment]
# Defaults to production compose file at infra/docker-compose.prod.yml.

ENVIRONMENT="${1:-production}"
COMPOSE_FILE="infra/docker-compose.prod.yml"
HEALTH_URL="http://localhost/v1/health/ready"
HEALTH_TIMEOUT_SECONDS=60
SLEEP_INTERVAL=5

if [[ "$ENVIRONMENT" != "production" ]]; then
  echo "[deploy] Only production deploys are supported by this script."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[deploy] Compose file not found: $COMPOSE_FILE"
  exit 1
fi

echo "[deploy] Starting migration job..."
docker compose -f "$COMPOSE_FILE" run --rm migration

echo "[deploy] Bringing up services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "[deploy] Waiting for readiness at $HEALTH_URL (up to ${HEALTH_TIMEOUT_SECONDS}s)..."
elapsed=0
healthy=false
while [[ $elapsed -lt $HEALTH_TIMEOUT_SECONDS ]]; do
  if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep "$SLEEP_INTERVAL"
  elapsed=$((elapsed + SLEEP_INTERVAL))
done

if [[ "$healthy" != "true" ]]; then
  echo "[deploy] Health check failed after ${HEALTH_TIMEOUT_SECONDS}s. Rolling back..."
  docker compose -f "$COMPOSE_FILE" down
  exit 1
fi

echo "[deploy] Deploy completed successfully and health check passed."
