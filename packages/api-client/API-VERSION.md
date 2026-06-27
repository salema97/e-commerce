# API Client versioning

The generated `@repo/api-client` package tracks the **REST API version** exposed by NestJS under `/v1`.

| Package version | API prefix | Status |
|-----------------|------------|--------|
| `1.0.0-v1`      | `/v1`      | Current |

## Rules

1. **Breaking HTTP contract changes** require a new API prefix (`/v2`) and a new major client line (`2.0.0-v2`).
2. **Non-breaking additions** (new endpoints, optional fields) bump the patch segment (`1.0.1-v1`).
3. Regenerate the client after Swagger changes (see workflow below).
4. Document consumer-facing changes in `CHANGELOG.md` before release tags.

## OpenAPI codegen workflow

1. Start the API (`pnpm --filter @repo/api dev`) so Swagger is available at `/v1/docs-json`.
2. Regenerate from the repo root:

   ```bash
   pnpm api-client:generate
   ```

   This fetches the spec, writes `src/generated/openapi.json` + `.openapi-checksum`, runs `swagger-typescript-api`, and builds `dist/`.

3. Extend hand-maintained layers as needed:
   - `src/client.ts` — typed facade over generated client + auth/error handling
   - `src/hooks/**` — TanStack Query hooks
   - `src/query-keys.ts` — shared invalidation keys

4. Verify the pinned spec in CI or offline:

   ```bash
   pnpm --filter @repo/api-client openapi:check
   ```

   - **Live mode:** fetches `API_SPEC_URL` (default `http://localhost:3001/v1/docs-json`) and compares with committed `openapi.json`.
   - **Offline mode:** when the API is unreachable, validates `openapi.json` against `.openapi-checksum`.

Environment overrides:

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_SPEC_URL` | `http://localhost:3001/v1/docs-json` | Swagger JSON endpoint |
| `API_SPEC_TIMEOUT_MS` | `10000` | Fetch timeout for generate/check |

## Lint

`pnpm --filter @repo/api-client lint` runs ESLint (shared flat config) on `src/client.ts`, `src/index.ts`, and `src/query-keys.ts`. Hook modules are excluded until floating-promise cleanup; `src/generated/**` is ignored.

## Migration guides

When `/v2` ships, add `MIGRATION-v1-to-v2.md` in this package with:

- Removed or renamed endpoints
- DTO field changes
- Auth/session changes affecting mobile and web

Until then, all apps (`apps/web`, `apps/mobile`) should depend on `workspace:^` and stay on `1.x-v1`.
