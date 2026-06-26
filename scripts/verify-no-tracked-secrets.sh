#!/usr/bin/env bash
set -euo pipefail

tracked=$(git ls-files '**/.env.local' '**/.env' 2>/dev/null | grep -v '.env.example' || true)

if [ -n "$tracked" ]; then
  echo "ERROR: tracked env files must not be committed:"
  echo "$tracked"
  exit 1
fi

echo "OK: no tracked .env / .env.local files"

echo ""
echo "If secrets were ever committed, rotate them in each provider dashboard:"
echo "  - AUTH_JWT_ACCESS_SECRET (invalidate all sessions)"
echo "  - STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET"
echo "  - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
echo "  - EVOLUTION_API_KEY / EVOLUTION_WEBHOOK_SECRET"
echo "  - RESEND_API_KEY, MEILI_API_KEY, database credentials"
echo "Optional history purge: git filter-repo or BFG (coordinate with team)."
