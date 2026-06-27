# API Client versioning

The generated `@repo/api-client` package tracks the **REST API version** exposed by NestJS under `/v1`.

| Package version | API prefix | Status |
|-----------------|------------|--------|
| `1.0.0-v1`      | `/v1`      | Current |

## Rules

1. **Breaking HTTP contract changes** require a new API prefix (`/v2`) and a new major client line (`2.0.0-v2`).
2. **Non-breaking additions** (new endpoints, optional fields) bump the patch segment (`1.0.1-v1`).
3. Regenerate the client after Swagger changes: `pnpm --filter @repo/api-client generate && pnpm --filter @repo/api-client build`.
4. Document consumer-facing changes in `CHANGELOG.md` before release tags.

## Migration guides

When `/v2` ships, add `MIGRATION-v1-to-v2.md` in this package with:

- Removed or renamed endpoints
- DTO field changes
- Auth/session changes affecting mobile and web

Until then, all apps (`apps/web`, `apps/mobile`) should depend on `workspace:^` and stay on `1.x-v1`.
