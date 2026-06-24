# Design: Phase 8–10 UI Closure

## Architecture

- **Web**: Server Components + `getServerApiClient` + `initialData` for admin lists; client islands for forms/uploads.
- **Mobile**: TanStack Query hooks from `@repo/api-client`; `AuthProvider` for push token lifecycle.
- **API**: Thin additions only where UI needed new read endpoints (`GET /marketing/promotions`).
- **Navigation**: Navbar/footer links to `/account`, `/help`, `/account/notifications`; admin sidebar sections per module.

## PR chain (stacked-to-main)

```text
main
 └── feat/phase-8-finance-ui-closure (PR #2)
      └── feat/phase-9-notifications-ui-closure (PR #3)
           └── feat/phase-10-ai-knowledge-ui-closure (PR #4)
```

## Conventions

- Spanish UI copy, neo-brutalist tokens
- No page-level loading skeletons
- `pnpm --filter @repo/web dev` uses webpack (Turbopack instability)
