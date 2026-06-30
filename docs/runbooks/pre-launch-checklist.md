# Pre-Launch Checklist

Use this checklist before taking the platform to production or a major release.

## Environment & Secrets
- [ ] `APP_ENV=production` is set in the API runtime environment.
- [ ] `NODE_ENV=production` is set for the web build and API.
- [ ] `AUTH_JWT_ACCESS_SECRET` is at least 32 random characters and shared only between API and web.
- [ ] Database credentials, Redis credentials, and provider API keys are injected via secrets, not files in the image.
- [ ] `DATABASE_URL` does not point to `localhost` or `127.0.0.1` in production; API boot validation rejects local database hosts when `APP_ENV=production`.
- [ ] `.env.example` files contain only safe placeholder tokens like `<generate-strong-secret>`; do not use `change-me`, `xxx`, `dev-*`, `sk_test_*`, or `whsec_xxx`. Use provider-specific tokens such as `<resend-api-key>`, `<posthog-key>`, `<kushki-private-key>`, and `<stripe-publishable-key>`.

## Payments
- [ ] `STRIPE_SECRET_KEY` is a live key (`sk_live_*`) in production.
- [ ] Stripe webhook secret matches the Stripe dashboard live endpoint.
- [ ] Local provider secrets (Kushki, PayPhone, MercadoPago, PlaceToPay) match production dashboards.
- [ ] Webhook idempotency TTLs are acceptable for production retry windows.

## SRI Ecuador E-Invoicing
- [ ] Company RUC is registered and active with SRI.
- [ ] `.p12` digital certificate is valid and not near expiry.
- [ ] `SRI_DIGITAL_CERTIFICATE_PATH` and `SRI_DIGITAL_CERTIFICATE_PASSWORD` are set.
- [ ] `SRI_TEST_ENVIRONMENT=false` in production.
- [ ] Authorized invoice sequences are loaded and match SRI-authorized ranges.

## Web Security
- [ ] Production CSP in `next.config.ts` does not contain `unsafe-inline` or `unsafe-eval` in `script-src`.
- [ ] `COOP: same-origin` and `CORP: same-origin` headers are served.
- [ ] `Strict-Transport-Security` is enabled with `includeSubDomains; preload`.
- [ ] CORS origins are explicit and do not include wildcard in production.

## API & Infrastructure
- [ ] Database connection pool (`DB_POOL_MAX`) and query timeout (`DB_QUERY_TIMEOUT_MS`) are configured.
- [ ] `/v1/health` and `/v1/health/ready` return expected responses.
- [ ] Redis, Meilisearch, and Evolution API are reachable from the API container.
- [ ] Docker Compose production file includes Meilisearch, Evolution API, reverse proxy, and migration job.
- [ ] Deploy script performs migrations and health-gated rollout.

## Mobile
- [ ] Release Android manifest does not contain `usesCleartextTraffic="true"`.
- [ ] `expo-secure-store` is used for tokens; no `localStorage` fallback is active.
- [ ] App store permissions (camera, location, notifications) are justified and declared in `app.json`.
- [ ] `SEED_USER_PASSWORD` and Stripe publishable key are not production secrets.

## Monitoring & Operations
- [ ] Sentry DSN is configured for API, web, and mobile.
- [ ] Alert events (`alert.sri_dlq`, `alert.webhook_failure`, `alert.5xx_spike`) are wired to an on-call channel.
- [ ] Database backups and PITR are enabled.
- [ ] Runbooks for SRI DLQ, webhook incidents, database failure, and API outage are accessible to the on-call team.

## Final Verification
- [ ] Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` without failures.
- [ ] Run Playwright smoke tests on Chromium, Firefox, and WebKit.
- [ ] Run Lighthouse CI budget/gate against the production build.
- [ ] Place a test order end-to-end (checkout → payment → invoice → delivery notification).
