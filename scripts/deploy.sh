#!/usr/bin/env bash
set -euo pipefail

# Health-gated production deploy script with automatic API rollback.
# Usage: ./scripts/deploy.sh [environment]
# Defaults to production compose file at infra/docker-compose.prod.yml.
#
# IMPORTANT: Database migrations are irreversible. If a deploy fails after the
# migration job has already applied schema changes, rolling back the API image
# will NOT undo those changes. Inspect the migration output and revert the
# schema manually if required before re-deploying.

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

capture_previous_api_image() {
  docker compose -f "$COMPOSE_FILE" ps -q api 2>/dev/null \
    | xargs -r docker inspect --format='{{.Config.Image}}' 2>/dev/null \
    || true
}

PREVIOUS_API_IMAGE=$(capture_previous_api_image)
echo "[deploy] Previous API image: ${PREVIOUS_API_IMAGE:-<none running>}"

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
  echo "[deploy] Health check failed after ${HEALTH_TIMEOUT_SECONDS}s. Rolling back API..."
  if [[ -n "$PREVIOUS_API_IMAGE" ]]; then
    API_IMAGE="$PREVIOUS_API_IMAGE" docker compose -f "$COMPOSE_FILE" up -d --no-deps --no-build api
    echo "[deploy] Rolled back API to $PREVIOUS_API_IMAGE."
  else
    echo "[deploy] No previous API image recorded; cannot roll back automatically."
  fi
  echo "[deploy] WARNING: Migrations are irreversible. If schema changes were applied, revert them manually before the next deploy."
  exit 1
fi

echo "[deploy] Deploy completed successfully and health check passed."
