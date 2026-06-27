# Best Practices — E-commerce Monorepo

Version-specific conventions for **every app and package** in this repository. Sourced from official docs (Next.js, NestJS, Expo, Prisma, TanStack Query) and a deep audit of the codebase.

## Table of contents

1. [Monorepo foundation](#monorepo-foundation)
2. [Shared packages](#shared-packages)
3. [API (`apps/api`)](#api-appsapi)
4. [Web (`apps/web`)](#web-appsweb)
5. [Mobile (`apps/mobile`)](#mobile-appsmobile)
6. [Cross-cutting concerns](#cross-cutting-concerns)
7. [Development workflow](#development-workflow)
8. [Known gaps (all apps)](#known-gaps-all-apps)

---

## Monorepo foundation

### Stack versions (pinned)

| Layer | Technology | Version |
|-------|------------|---------|
| Workspace | pnpm + Turborepo | 10.34.3 / 2.9.18 |
| Runtime | Node.js | ≥22.23.0 LTS |
| Language | TypeScript | 5.9.3 |
| API | NestJS + Prisma | 11.1.27 / 7.8.0 |
| Web | Next.js + React | 16.2.9 / 19.2.3 |
| Mobile | Expo SDK + RN | 56.0.12 / 0.85.3 |
| Validation | Zod | 4.4.3 |
| Server state | TanStack Query | ^5.66.0 |

### Golden rules

| Rule | Why |
|------|-----|
| `apps/*` depend on `packages/*`; never the reverse | Prevents circular deploy graphs |
| `workspace:^` for internal packages | pnpm workspace protocol |
| `catalog:` in `pnpm-workspace.yaml` for shared versions | One React, one TS, one Zod |
| Root `pnpm.overrides` for React 19.2.3 | Single React instance (critical for mobile) |
| **pnpm 11 blocked** | Prisma 7 engine constraint — stay on pnpm 10.x |
| Turbo `build` → `dependsOn: ["^build"]` | Packages emit `.d.ts` before apps typecheck |

### Build order

```text
shared-config → shared-types → shared-utils → { shared-ui, api-client } → apps/*
```

### Turbo tasks

| Task | Behavior |
|------|----------|
| `dev` | No cache, persistent |
| `build`, `typecheck`, `lint`, `test` | `dependsOn: ^build` |
| `test:e2e` | Full build, cache disabled |

After editing any `packages/*` source, run `pnpm --filter @repo/<pkg> build` or `pnpm build` from root.

---

## Shared packages

See [AGENTS.md](../AGENTS.md) for architecture decisions. Package reference:

| Package | Purpose | Consumers | Key rule |
|---------|---------|-----------|----------|
| `@repo/shared-config` | ESLint, TS, Prettier, Tailwind base | All | Extend configs; never import at runtime |
| `@repo/shared-types` | DTOs, enums, interfaces | All | **Runtime-free** — no Zod, no React |
| `@repo/shared-utils` | Zod schemas, formatters, commerce helpers | api, web, mobile, api-client | Single validation source |
| `@repo/shared-ui` | RN primitives + `neo` tokens | **mobile only** today | `react-native` APIs; web uses shadcn |
| `@repo/api-client` | `createApiClient`, `createQueryHooks`, `queryKeys` | web, mobile | `@tanstack/react-query` is **peerDep** |

### Validation layering

```text
shared-types (interfaces)  ←→  NestJS DTOs (class-validator)
shared-utils (Zod)         ←→  web/mobile forms + API webhooks
```

### OpenAPI / api-client workflow

1. Change NestJS controller + Swagger decorators.
2. `pnpm api-client:generate` — fetches `/v1/docs-json`, pins `src/generated/openapi.json` + checksum, runs `swagger-typescript-api`, builds `dist/`.
3. Add types to `shared-types` if new shapes.
4. Add Zod to `shared-utils` if shared validation.
5. Extend `api-client/src/client.ts` + domain hooks + `queryKeys` where the generated client needs a typed facade.
6. CI / offline: `pnpm --filter @repo/api-client openapi:check` (live fetch compare or checksum fallback).

See [packages/api-client/API-VERSION.md](../packages/api-client/API-VERSION.md).

**Never** duplicate `queryKeys` strings in apps — import from `@repo/api-client`.

### Adding a new endpoint (full stack checklist)

- [ ] NestJS module + DTO + `@Roles()` + audit if admin mutation
- [ ] `shared-types` interface/DTO
- [ ] `shared-utils` Zod (if shared)
- [ ] `api-client` method + hook + `queryKeys` entry
- [ ] Web RSC or mobile screen consuming hook

---

## API (`apps/api`)

NestJS 11 REST API at `/v1`. ESM (`"type": "module"`).

### Architecture (what this repo does well)

- **Feature modules** per bounded context (`ProductsModule`, `OrdersModule`, …).
- **Fail-fast env** — Zod in `config/env.validation.ts` at boot.
- **Global guards** — `AppThrottlerGuard`, `JwtAuthGuard`, `RolesGuard` via `APP_GUARD`.
- **Global audit** — `AuditInterceptor` + immutable `AuditLog` Prisma extension.
- **Prisma 7** — `pg` pool + `@prisma/adapter-pg` in `PrismaService`.
- **Stripe webhooks** — raw body preservation, signature verify, Redis idempotency.
- **BullMQ** — SRI queue, knowledge index (manual Queue/Worker, not `@nestjs/bullmq`).
- **Circuit breakers** — external providers (Stripe, SRI, email, Evolution).
- **Swagger** — `/docs` in dev only; disabled in production.

### Key production dependencies

| Package | Version | Do | Don't | Example |
|---------|---------|-----|-------|---------|
| `@nestjs/common/core` | 11.1.27 | Thin controllers; inject services | Business logic in controllers | `*.controller.ts` |
| `@nestjs/config` | 4.0.4 | `getOrThrow` for secrets | Raw `process.env` in services | `env.validation.ts` |
| `class-validator` | 0.15.1 | DTOs + global `ValidationPipe` | Skip validation on public webhooks without Zod | `create-product.dto.ts` |
| `@prisma/client` | 7.8.0 | Transactions; `$extends` for audit immutability | Raw SQL without params | `orders.service.ts` |
| `@prisma/adapter-pg` + `pg` | 7.8.0 | Single pool in `PrismaService` | New pool per request | `prisma.service.ts` |
| `argon2` | 0.44.0 | Password hashing via `PasswordService` | Plaintext or weak bcrypt | `password.service.ts` |
| `helmet` | 8.2.0 | Security headers in `main.ts` | Disable in prod | `main.ts` |
| `@nestjs/throttler` | 6.5.0 | Redis storage; `@Throttle` on login/checkout/webhooks | In-memory limiter in prod cluster | `app-throttler.guard.ts` |
| `nestjs-pino` | 4.6.1 | Structured logs | `console.log` in services | `app.module.ts` |
| `stripe` | ^22.0.0 | Verify webhook on **raw body**; idempotency keys | Trust client payment success | `stripe-webhook.service.ts` |
| `bullmq` | ^5.49.2 | Async SRI/email/index jobs | Heavy work in HTTP handler | `sri-queue.module.ts` |
| `ioredis` | 5.11.1 | Shared `RedisService` | Connection per operation | `redis.service.ts` |
| `meilisearch` | 0.58.0 | Async index; Prisma = source of truth | Treat Meili as SoT | `catalog.service.ts` |
| `soap` + XML stack | — | SRI via circuit breaker + retries | Unsigned XML to SRI | `sri-soap.client.ts` |
| `@aws-sdk/client-s3` | 3.1068.0 | Presigned URLs | Public buckets for private docs | `storage.service.ts` |

### Prisma 7 (required pattern)

```typescript
// apps/api/src/prisma/prisma.service.ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
super({ adapter: new PrismaPg(pool) });
```

- Datasource URL in `prisma.config.ts`, not only in schema.
- Run `pnpm --filter @repo/api exec prisma generate` before `dev` if client is missing.

### Auth & RBAC

- Access JWT via `AppJwtService`; refresh hashed in `AuthSession`.
- `@Public()` opts out of JWT guard; `@Roles(...)` opts in to RBAC.
- **Secure endpoints must declare `@Roles`** — missing decorator = allowed by default.

### Global ValidationPipe (`main.ts`)

```typescript
whitelist: true, transform: true, forbidNonWhitelisted: true
```

### Security checklist

| Area | Status |
|------|--------|
| Input validation (DTO + Zod webhooks) | ✅ |
| JWT + RBAC | ✅ |
| Redis rate limiting | ✅ |
| CORS explicit | ✅ |
| Webhook signatures | ✅ |
| Audit log immutability | ✅ |
| Swagger in prod | ✅ Disabled |
| `ENABLE_TEST_AUTH` in prod | ⚠️ Must be `false` |

### Testing

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `src/**/*.spec.ts` |
| E2E | Vitest + supertest | `test/**/*.e2e-spec.ts` |

### API commands

```bash
pnpm --filter @repo/api dev
pnpm --filter @repo/api exec prisma generate
pnpm --filter @repo/api prisma:migrate
pnpm --filter @repo/api test
pnpm --filter @repo/api test:e2e
pnpm --filter @repo/api health:nest
```

### API gaps (resolved)

1. ✅ **ESLint** — `apps/api/eslint.config.mjs` extends shared config; `pnpm --filter @repo/api lint`.
2. ✅ **Env validation** — split into `env.core.schema.ts` + `env.providers.schema.ts` with dev-friendly defaults.
3. ✅ **`@repo/api-client` devDep** — moved out of runtime `dependencies`.
4. ✅ **BullMQ shutdown** — `SriQueueLifecycle` + `KnowledgeIndexQueueLifecycle` call `queue.close()` on destroy.
5. ✅ **Swagger path** — `/v1/docs` via `useGlobalPrefix: true`.
6. ✅ **api-client codegen** — `openapi:check`, `pnpm api-client:generate` (see API-VERSION.md).

---

## Web (`apps/web`)

**Stack (web, pinned in repo):**

| Layer | Version |
|-------|---------|
| Next.js | 16.2.9 |
| React / React DOM | 19.2.3 (pnpm catalog) |
| TypeScript | 5.9.3 |
| TanStack Query | ^5.66.0 (catalog) |
| Tailwind CSS | 4.3.1 |
| jose | 6.2.3 |
| Vitest | 4.1.9 |
| Playwright | ^1.55.1 |

---

## Web (`apps/web`)

### App Router architecture in this repo

The web app is a single Next.js 16 App Router project that serves the **landing**, **customer store**, **account area**, **checkout**, and **embedded admin panel** (`/admin`).

```
apps/web/src/
├── app/
│   ├── layout.tsx              # Root RSC: fonts, metadata, Providers, StoreChrome
│   ├── providers.tsx           # Client: QueryClient, Auth, Motion, Analytics
│   ├── globals.css             # Tailwind 4 @theme tokens
│   ├── store/                  # Public catalog (RSC-first)
│   ├── admin/                  # Staff panel (RSC layout + client panels)
│   ├── account/                # Customer self-service
│   ├── api/
│   │   ├── auth/               # BFF: login/register/logout/me (sets httpOnly cookies)
│   │   └── v1/[...path]/       # BFF proxy → NestJS /v1 (injects Bearer from cookie)
│   └── ...
├── components/
│   ├── ui/                     # shadcn/Radix primitives
│   ├── admin/                  # Admin-only UI
│   ├── store/                  # Store UI
│   └── checkout/               # Checkout + Stripe Elements
├── contexts/auth-context.tsx   # Client session mirror (user profile)
├── lib/
│   ├── api.ts                  # getServerApiClient() — RSC / Server Actions
│   ├── client-api.ts           # useApiClient() — browser via /api/v1 proxy
│   ├── session.ts              # getSession() — jose + cookies() in RSC
│   ├── auth-cookies.ts         # Cookie names + httpOnly options
│   ├── auth-proxy.ts           # Sets tokens after login/register
│   ├── server-action-auth.ts   # requireServerRoles / requireServerAuthToken
│   ├── cart-store.ts           # Zustand + persist (client cart)
│   └── wishlist-store.ts       # Zustand + persist
└── middleware.ts               # /admin RBAC + /account auth gate (jose jwtVerify)
```

**Route model**

| Area | Pattern | Default rendering | Auth |
|------|---------|-------------------|------|
| Store catalog | `app/store/page.tsx`, `app/store/[slug]/page.tsx` | Async RSC + `getServerApiClient()` | Public |
| Admin | `app/admin/**` | RSC layout + client panels for live data | Middleware + layout redirect |
| Account | `app/account/**` | Mixed RSC + client | Middleware matcher + cookie session |
| Auth BFF | `app/api/auth/*` | Route Handlers | Sets/clears httpOnly cookies |
| API BFF | `app/api/v1/[...path]/route.ts` | Route Handler proxy | Forwards `Authorization: Bearer` from cookie |

**RSC boundary rules (Next.js 16 + React 19)**

1. **Default to Server Components** — no `'use client'` unless the file needs hooks, browser APIs, or event handlers.
2. **Async only on the server** — pages like `AdminProductsPage` and `ProductPage` are async RSC; client files (`support-inbox.tsx`, `payment-element.tsx`) are sync.
3. **Serializable props only** — pass plain objects from RSC to client components (e.g. `SupportInbox` receives `initialConversations`, `ProductReviews` receives `initialReviews`).
4. **Push `'use client'` leaves down** — e.g. `AdminPageHeader` stays a Server Component; `AdminTopBar` / `AdminSidebar` are client for navigation hooks.
5. **Next.js 16 async request APIs** — always `await params`, `await searchParams`, and `await cookies()` (see `ProductPage`, `StorePage`, `getSession`).

**Provider tree** (`app/providers.tsx`)

```
QueryClientProvider
  └── AuthProvider          # fetch /api/auth/me on mount
        └── NeoMotionProvider
              └── AnalyticsProvider   # consent-gated PostHog + Clarity
                    └── children
```

**Dev / build notes**

- `pnpm dev` runs `next dev --webpack` (explicit webpack; Next 16 defaults to Turbopack).
- `next.config.ts` sets `allowedDevOrigins` for Playwright (`127.0.0.1`), security headers, CSP, and `experimental.optimizePackageImports` for `lucide-react`.
- Images: `next/image` with `remotePatterns` from `AWS_S3_PUBLIC_URL`.

**Repo examples**

| Concern | File |
|---------|------|
| Root layout + metadata | `src/app/layout.tsx` |
| Admin shell (RSC auth) | `src/app/admin/layout.tsx` |
| Admin list (RSC fetch) | `src/app/admin/products/page.tsx` |
| Store catalog (RSC + Suspense) | `src/app/store/page.tsx` |
| Product PDP (RSC + JSON-LD) | `src/app/store/[slug]/page.tsx` |
| Live admin panel (client + Query) | `src/app/admin/support/support-inbox.tsx` |
| BFF proxy | `src/app/api/v1/[...path]/route.ts` |

---

### Per-library reference

#### Production dependencies

| Package | Version | Purpose | Correct usage in this repo | Common mistakes | Example |
|---------|---------|---------|---------------------------|-----------------|---------|
| `next` | 16.2.9 | App Router framework | Async RSC pages; Route Handlers under `app/api/`; `middleware.ts` for edge auth | Using sync `params`/`cookies()` without `await`; colocating GET Route Handler + `page.tsx` on same path | `src/app/store/[slug]/page.tsx` |
| `react` / `react-dom` | 19.2.3 | UI runtime | React 19 `use()` in `useAuth()`; function components | Async client components; passing functions from RSC to client | `src/contexts/auth-context.tsx` |
| `@repo/api-client` | workspace | Generated REST client + hooks factory | **Server:** `getServerApiClient()` → direct NestJS URL. **Client:** `useApiClient()` → `/api/v1` proxy | Calling NestJS directly from browser (CORS, exposes token handling); duplicating endpoints outside client | `src/lib/api.ts`, `src/lib/client-api.ts` |
| `@repo/shared-types` | workspace | DTOs, `Role`, analytics event names | Import types only; no runtime logic | Re-defining API shapes in web | `src/lib/auth.ts` |
| `@repo/shared-utils` | workspace | `formatPrice`, Zod schemas, JSON-LD helpers | Shared formatters in RSC and client | Copying formatters into web | `src/app/store/[slug]/page.tsx` |
| `@repo/shared-config` | workspace | ESLint/TS extends | Dev tooling only | Importing in runtime components | `tsconfig.json` |
| `@tanstack/react-query` | ^5.66.0 | Client server-state cache | v5 object API: `useQuery({ queryKey, queryFn, enabled })`; `useMutation` + `queryClient.invalidateQueries` | v4 array API; fetching in RSC with useQuery; missing `enabled: authReady` on protected queries | `src/app/admin/support/support-inbox.tsx` |
| `zustand` | ^5.0.4 | Client-only UI state | `create()` + `persist` for cart/wishlist; checkout uses `useReducer` instead | Storing server cart as source of truth; persisting auth tokens | `src/lib/cart-store.ts`, `src/lib/wishlist-store.ts` |
| `jose` | 6.2.3 | JWT verify (no sign on web) | `jwtVerify(token, TextEncoder.encode(secret))` in middleware + `getSession()` | Verifying without checking `payload.type === 'access'`; signing JWTs on web | `src/middleware.ts`, `src/lib/session.ts` |
| `@radix-ui/react-*` | see lockfile | Accessible primitives (shadcn base) | Compose in `components/ui/*`; use `asChild` + Radix Slot where needed | Reimplementing focus trap / aria; importing raw Radix in pages | `src/components/ui/dialog.tsx`, `sheet.tsx` |
| `class-variance-authority` | ^0.7.1 | Variant styles for UI | `cva()` in `*-variants.ts`; consumed by thin components | Inline duplicate variant class strings | `src/components/ui/button-variants.ts` |
| `clsx` + `tailwind-merge` | ^2.1.1 / ^3.2.0 | Class merging | `cn()` from `@/lib/utils` everywhere | Manual string concat fighting Tailwind precedence | `src/lib/utils.ts` |
| `lucide-react` | ^0.511.0 | Icons | Tree-shaken imports; listed in `optimizePackageImports` | `import * as Icons` barrel | `src/components/layout/admin-sidebar.tsx` |
| `motion` | 12.41.0 | Animations (Framer successor) | `'use client'` + `useReducedMotion()` for a11y | Animating layout in RSC; ignoring reduced motion | `src/components/layout/admin-sidebar.tsx` |
| `@stripe/stripe-js` | ^7.0.0 | Load Stripe.js | Singleton `loadStripe()` promise | Creating new Stripe instance per render | `src/components/checkout/payment-element.tsx` |
| `@stripe/react-stripe-js` | ^4.0.0 | Payment Element UI | `<Elements>` wraps form; `confirmPayment` with `redirect: 'if_required'` | Handling fulfillment in client instead of webhook | `src/components/checkout/payment-element.tsx` |
| `posthog-js` | 1.393.0 | Product analytics + flags | Dynamic `import('posthog-js')` after consent; dual-write to API `/analytics/events` | Loading before cookie consent; blocking UX on analytics failure | `src/lib/analytics/track.ts` |
| `sonner` | 2.0.7 | Toast notifications | `<AdminToaster />` in admin layout | `alert()` for admin feedback | `src/components/admin/admin-toaster.tsx` |

#### Dev dependencies

| Package | Version | Purpose | Correct usage | Common mistakes | Example |
|---------|---------|---------|---------------|-----------------|---------|
| `tailwindcss` | 4.3.1 | Utility CSS | `@import "tailwindcss"` + `@theme` in `globals.css`; PostCSS plugin | Keeping Tailwind 3 `tailwind.config` content array as sole source; `@apply` overuse | `src/app/globals.css`, `postcss.config.mjs` |
| `@tailwindcss/postcss` | ^4.3.1 | Tailwind 4 PostCSS entry | Single plugin in `postcss.config.mjs` | Missing PostCSS plugin after TW4 upgrade | `postcss.config.mjs` |
| `@playwright/test` | ^1.55.1 | E2E | `webServer` spins API + web; use `127.0.0.1`; auth fixtures | Hardcoding `localhost` without `allowedDevOrigins` | `playwright.config.ts`, `e2e/checkout.spec.ts` |
| `vitest` | 4.1.9 | Unit/component tests | `environment: 'jsdom'`; colocate `*.test.tsx` | Testing RSC without extracting logic; missing QueryClient wrapper | `vitest.config.ts`, `src/contexts/auth-context.test.tsx` |
| `@testing-library/react` | ^16.2.0 | Component testing | Render client components; mock fetch/auth | Testing implementation details | `src/components/admin/support/conversation-list.test.tsx` |
| `@vitejs/plugin-react` | ^5.2.0 | Vitest React transform | Plugin in vitest config | Using Vitest without React plugin for TSX | `vitest.config.ts` |
| `@next/bundle-analyzer` | 16.2.6 | Bundle analysis | `pnpm analyze` → `ANALYZE=true next build` | Running analyzer in CI without size gates | `next.config.ts` |
| `react-doctor` | 0.5.8 | React health scan | `pnpm health:react` locally / CI advisory | Treating as linter replacement | `package.json` scripts |
| `cross-env` | 10.1.0 | Cross-platform env | `ANALYZE=true` on Windows | Inline env without cross-env in npm scripts | `package.json` `analyze` script |
| `dotenv` | 17.4.2 | E2E env loading | Playwright loads `apps/api/.env` + `.env.local` | Committing secrets into `.env.local` | `playwright.config.ts` |
| `eslint` / `typescript` | catalog | Lint / types | `pnpm lint`, `pnpm typecheck` | Skipping typecheck before PR | `package.json` scripts |

#### shadcn/ui convention

- Config: `components.json` — `rsc: true`, CSS variables, aliases `@/components/ui`.
- Add components via shadcn CLI into `src/components/ui/`; customize with neo-brutalist tokens in `globals.css`.
- **Pattern:** variants in `*-variants.ts`, thin component in `*.tsx`, pages import from `@/components/ui/*`.
- **Do not** edit Radix behavior in page files; extend in the ui layer.

---

### Auth / session flow

Native JWT auth with **httpOnly cookies** (not localStorage). Web never stores refresh/access tokens in JS-accessible storage.

```
┌─────────────┐     POST /api/auth/login      ┌──────────────┐
│ SignInForm  │ ─────────────────────────────►│ auth-proxy   │
│  (client)   │                               │ Route Handler│
└─────────────┘                               └──────┬───────┘
       │ setSession(user)                             │ POST /v1/auth/login
       ▼                                              ▼
┌─────────────┐                               ┌──────────────┐
│ AuthContext │◄── GET /api/auth/me ──────────│ NestJS API   │
│  (client)   │    (Bearer from cookie)       │ issues JWT   │
└─────────────┘                               └──────────────┘
       ▲
       │ cookies: access_token, refresh_token (httpOnly, SameSite=lax)
       │
┌─────────────┐     jwtVerify (jose)          ┌──────────────┐
│ middleware  │ ─── /admin/* + /account/* ───►│ redirect     │
│             │     silent refresh via cookie │ /sign-in     │
└─────────────┘     canAccessAdminPath (admin)└──────────────┘
       │
┌─────────────┐     getSession() / getCurrentUser()
│ AdminLayout │ ─── RSC double-check + role redirect
│  (RSC)      │
└─────────────┘
```

**Cookie contract** (`src/lib/auth-cookies.ts`)

| Cookie | Purpose | Flags |
|--------|---------|-------|
| `access_token` | Short-lived JWT for API | `httpOnly`, `sameSite: 'lax'`, `secure` in prod/staging/preview |
| `refresh_token` | Rotating refresh (30d) | Same; cleared on logout |

**Verification**

- **Edge:** `middleware.ts` — `jwtVerify` with `AUTH_JWT_ACCESS_SECRET`; checks `payload.type === 'access'` and `Role`. Covers `/admin/*` (RBAC) and `/account/*` (authenticated). Attempts silent refresh via `fetchAuthRefresh` when access cookie is expired but refresh cookie exists.
- **RSC:** `getSession()` — same verify via `cookies()` (Next.js 16 async API).
- **Server Actions:** `requireServerRoles()` / `requireServerAuthToken()` in `server-action-auth.ts`.

**Client auth context** (`src/contexts/auth-context.tsx`)

- On mount: `GET /api/auth/me` → sets `user`, `loading`, `isAuthenticated`.
- Login: Route Handler sets cookies → client calls `setSession(user)` (optimistic; no token in JS).
- Logout: `POST /api/auth/logout` revokes refresh server-side + clears cookies.
- Refresh: `POST /api/auth/refresh` rotates tokens via NestJS; used by middleware and `auth-refresh.ts` on client 401.

**BFF proxy** (`src/app/api/v1/[...path]/route.ts`)

- Reads `access_token` cookie → adds `Authorization: Bearer`.
- Browser client uses `window.location.origin + '/api/v1'` (`client-api.ts`) so tokens never leave httpOnly cookies.

**RBAC**

- Middleware: path-level admin RBAC via `canAccessAdminPath` (`src/lib/admin-nav.ts`).
- NestJS: `@Roles()` remains source of truth for mutations.
- UI: `filterAdminNav(role)` hides nav items; **never** rely on UI alone.

**Next.js 16 auth best practices alignment**

| Practice | Status in repo |
|----------|----------------|
| httpOnly session cookies | ✅ |
| Verify JWT in middleware for protected routes | ✅ `/admin` + `/account` |
| Re-verify in Server Components / Actions | ✅ layout + `requireServerRoles` |
| `jose` instead of `jsonwebtoken` in edge | ✅ |
| Do not expose `AUTH_JWT_ACCESS_SECRET` to client | ✅ |
| Refresh rotation on 401 | ✅ BFF `/api/auth/refresh` + client `onUnauthorized` + RSC `refreshServerAuthSession` |

---

### Data fetching decision tree (RSC vs useQuery vs Server Action)

Use this tree for **new** web features:

```
Need data or mutation?
│
├─ SEO-critical or first paint (catalog, PDP, admin tables)?
│   └─► Async Server Component
│       • getServerApiClient() → NestJS (direct, server-only URL)
│       • await params / searchParams
│       • Pass serializable props to client islands
│       • Example: app/store/page.tsx, app/admin/products/page.tsx
│
├─ Live / polling / optimistic UI (inbox, filters, checkout)?
│   └─► Client Component + TanStack Query v5
│       • useApiClient() → /api/v1 proxy (cookie auth)
│       • enabled: useAuthApiReady() when auth required
│       • initialData from RSC parent when possible (avoid loading flash)
│       • Example: app/admin/support/support-inbox.tsx
│
├─ Mutation from admin form (retry invoice, role-gated, no client secret)?
│   └─► Server Action ('use server')
│       • requireServerRoles + fetch with Bearer from cookie
│       • Example: app/admin/invoices/actions.ts
│
├─ Auth/session (login, logout, me)?
│   └─► Route Handler under app/api/auth/*
│       • Sets httpOnly cookies; never return raw tokens to client JS
│
├─ Browser must call API with cookie auth (all client REST)?
│   └─► /api/v1/[...path] proxy (existing BFF)
│
└─ Client-only ephemeral state (cart UI, wishlist, checkout step)?
    └─► Zustand (+ persist) or useReducer
        • cart-store.ts, wishlist-store.ts, checkout-state.ts
        • Sync to server cart API at checkout boundary only
```

**Caching (Next.js 16)**

| Layer | Current pattern | Recommendation |
|-------|-----------------|----------------|
| RSC fetches | Implicit default (dynamic when using `cookies()`) | Catalog/PDP: consider `'use cache'` + tags when auth not required |
| Route Handlers | `cache: 'no-store'` on auth/proxy | Keep for authenticated proxy |
| TanStack Query | `staleTime: 60_000`, `refetchOnWindowFocus: false` | Tune per domain (inbox: `refetchInterval: 10_000`) |
| NestJS catalog | Redis TTL server-side | Web benefits from RSC cache + CDN for public pages |

**Anti-patterns observed / avoided**

- ❌ `useQuery` in Server Components
- ❌ Storing JWT in Zustand or `localStorage`
- ❌ Trusting client-side role checks without API enforcement
- ❌ Stripe fulfillment logic in `confirmPayment` success handler (webhook is source of truth — ✅ documented in `payment-element.tsx`)

---

### TanStack Query (v5)

**Setup:** singleton browser `QueryClient` in `providers.tsx` (SSR-safe factory pattern from TanStack docs).

**Defaults:**

```typescript
staleTime: 60 * 1000,
refetchOnWindowFocus: false,
```

**Hooks factory:** `@repo/api-client` exports `createQueryHooks(client)` — prefer shared `queryKeys` from `@repo/api-client` for invalidation consistency.

**Patterns in repo**

| Pattern | Where |
|---------|-------|
| RSC seed + client refetch | `SupportInbox` — `initialData` when filters empty |
| Auth-gated queries | `enabled: useAuthApiReady()` |
| Polling | Support inbox `refetchInterval: 10_000` |
| Mutations + invalidation | Gift cards, store credits, WhatsApp templates |

**Correct v5 mutation shape**

```typescript
const mutation = useMutation({
  mutationFn: (body) => api.resource.create(body),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource'] }),
});
```

---

### Zustand (v5)

**Use for:** client-only, persisted preferences — cart lines, wishlist.

| Store | File | Persist key |
|-------|------|-------------|
| Cart | `src/lib/cart-store.ts` | `ecommerce-cart` |
| Wishlist | `src/lib/wishlist-store.ts` | `ecommerce-wishlist` |

**Do not use for:** auth, server cart sync, checkout payment state (use `checkoutReducer` in `checkout-state.ts`).

**Checkout:** multi-step wizard state is **`useReducer`**, not Zustand — keeps payment flow ephemeral and testable.

---

### Radix UI + shadcn/ui

- Radix packages are **direct dependencies** (not bundled through a single `@radix-ui/react` meta-package).
- shadcn components live in `src/components/ui/` with project styling (neo-brutalist borders, `--radius: 0`).
- Prefer **composition**: `Sheet` for mobile admin nav (`admin-top-bar.tsx`), `Tooltip` in sidebar, `Dialog` for modals.
- When adding a component: `npx shadcn@latest add <component>` from `apps/web` respecting `components.json`.

---

### Tailwind CSS 4

**Config model:** CSS-first — tokens in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-neo-gold: #ffd800;
  /* semantic tokens → --color-primary, etc. */
}
```

**PostCSS:** `@tailwindcss/postcss` only (`postcss.config.mjs`).

**Fonts:** `next/font/google` in root layout → CSS variables `--font-space-grotesk`, `--font-anton`.

**Utilities:** use `cn()` for conditional classes; component classes like `.brutalist-card` in `@layer components`.

**Tailwind 4 migration pitfalls**

- Do not rely on deprecated `tailwind.config.ts` `content` array alone — ensure `@import "tailwindcss"` scans App Router paths.
- Prefer `@theme` tokens over hard-coded hex in pages.

---

### Stripe Elements

**Versions:** `@stripe/stripe-js` ^7, `@stripe/react-stripe-js` ^4.

**Flow**

1. Client creates order via API → receives `clientSecret` (PaymentIntent).
2. `PaymentForm` wraps `Elements` with memoized `{ clientSecret, appearance }`.
3. `stripe.confirmPayment({ redirect: 'if_required' })` — stay on page when possible.
4. **Order paid status** comes from Stripe webhook → NestJS, not from client success alone.

**Env:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only on client; secret keys stay on API.

**PCI:** never post raw card data to NestJS or Next Route Handlers — Payment Element only.

---

### PostHog

**Version:** `posthog-js` 1.393.0.

**Consent-first** (`AnalyticsProvider` + `cookie-consent-banner.tsx`):

1. No init until analytics consent stored.
2. Dynamic import to avoid bloating initial bundle.
3. `identify(userId)` when authenticated.
4. Dual pipeline: `posthog.capture` + POST `/api/v1/analytics/events` for internal store.

**Feature flags:** `isFeatureEnabled(flag)` — returns `false` if PostHog not initialized.

**Env:** `NEXT_PUBLIC_POSTHOG_KEY`, optional `NEXT_PUBLIC_POSTHOG_HOST`.

**Optional:** Microsoft Clarity loaded when recording consent granted (`NEXT_PUBLIC_CLARITY_PROJECT_ID`).

---

### Playwright (E2E)

**Config:** `apps/web/playwright.config.ts`

- **baseURL:** `http://127.0.0.1:3000` (not `localhost` — matches `allowedDevOrigins`).
- **webServer:** starts `@repo/api` then `next dev --webpack`.
- **Requires:** `AUTH_JWT_ACCESS_SECRET` aligned between `apps/api/.env` and `apps/web/.env.local`.
- **Fixtures:** `e2e/fixtures/auth.ts`, domain helpers for invoices/support.

**Specs:** `checkout.spec.ts`, `support-inbox.spec.ts`, `invoices.spec.ts`, `returns.spec.ts`, `smoke.spec.ts`.

**Run:** `pnpm --filter @repo/web test:e2e`

**Best practices**

- Use role-based login fixtures, not UI-only shortcuts.
- Prefer `getByRole` selectors for a11y-aligned tests.
- Set `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` when iterating locally.

---

### Vitest (unit / component)

**Config:** `vitest.config.ts` — jsdom, `@/` alias, `vitest.setup.ts` (jest-dom matchers).

**Scope:** `src/**/*.test.{ts,tsx}` — currently focused on auth context, support inbox, invoice UI.

**Run:** `pnpm --filter @repo/web test`

**Best practices**

- Test client components in isolation with mocked `fetch` / providers.
- Extract pure reducers (`checkoutReducer`) for unit tests without jsdom.
- Wrap Query-dependent components with `QueryClientProvider` in tests.

---

### Performance & SEO

**Performance**

| Technique | Implementation |
|-----------|----------------|
| RSC for catalog/PDP | Reduces client JS; data fetched on server |
| `Promise.all` / `Promise.allSettled` | `StorePage`, `ProductPage` parallel fetches |
| `next/image` + AVIF/WebP | `next.config.ts` `images.formats` |
| Package import optimization | `lucide-react`, `@repo/shared-ui` |
| Dynamic import | `posthog-js` after consent |
| Stripe.js singleton | `getStripe()` cached promise |
| PWA | `ServiceWorkerRegistration` in root layout |
| Motion a11y | `useReducedMotion()` in animated components |

**SEO**

| Technique | Implementation |
|-----------|----------------|
| `metadata` export / `generateMetadata` | Root template; PDP title/description |
| JSON-LD Product schema | `store/[slug]/page.tsx` with `serializeJsonLd` |
| Semantic HTML | Single `<main id="main-content">`, skip link |
| `lang="es"` | Root `<html lang="es">` |
| Canonical URLs | ✅ `alternates.canonical` on store listing + PDP via `NEXT_PUBLIC_SITE_URL` |

**Security headers (production)**

- CSP, HSTS, `X-Frame-Options`, `Referrer-Policy` via `next.config.ts` `headers()`.
- Note: CSP includes `'unsafe-inline'` / `'unsafe-eval'` for dev compatibility — tighten for production hardening.

---

### Top 5 gaps (resolved)

1. ✅ **Token refresh BFF** — `app/api/auth/refresh/route.ts`, `auth-proxy.ts`, and `auth-refresh.ts` rotate httpOnly cookies; middleware retries with refresh before redirect.

2. ✅ **Middleware coverage** — `middleware.ts` matcher includes `/account/:path*` with sign-in redirect; admin RBAC unchanged.

3. ✅ **Server Actions** — pattern in `app/admin/invoices/actions.ts` and `app/admin/fulfillments/actions.ts`; prefer for new role-gated mutations.

4. ✅ **Public catalog caching** — `src/lib/public-catalog.ts` with `'use cache'`, `cacheTag`, `cacheLife`; `cacheComponents: true` in `next.config.ts`.

5. ✅ **Test coverage expanded** — `auth-refresh.test.ts`, `e2e/auth-refresh.spec.ts`; continue adding specs as admin surface grows.

---

### Environment variables (web)

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_JWT_ACCESS_SECRET` | Yes (server) | Must match API; middleware + session verify |
| `API_BASE_URL` | Server | Direct NestJS URL for RSC/Actions (default `http://localhost:3001/v1`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout | Stripe.js |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog API host |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Optional | Session recording |
| `AWS_S3_PUBLIC_URL` | Images | `next/image` remotePatterns |

---

### Commands

```bash
pnpm --filter @repo/web dev          # next dev --webpack :3000
pnpm --filter @repo/web build
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web lint
pnpm --filter @repo/web test         # Vitest
pnpm --filter @repo/web test:e2e     # Playwright (starts API + web)
pnpm --filter @repo/web analyze      # Bundle analyzer
```

---

## Mobile (`apps/mobile`)

Expo SDK **56** + React Native **0.85.3** + Expo Router **~56.2.11**.

### Navigation (Expo Router)

| Layer | Path | Role |
|-------|------|------|
| Entry | `package.json` → `expo-router/entry` | Bootstrap |
| Router root | `app.json` plugin `{ "root": "src/app" }` | File-based routes |
| Root layout | `src/app/_layout.tsx` | Providers + `<Stack />` |
| Tabs | `src/app/(tabs)/_layout.tsx` | Inicio, Tienda, Carrito, Cuenta |
| Hidden route | `(tabs)/product/[id]` | `href: null` — not a tab bar item |
| Deep links | `src/lib/deep-links.ts` | `ecommerce://product/:id`, etc. |

**Provider tree:** `SafeAreaProvider` → `AuthProvider` → `QueryClientProvider` → `StripeProvider` → `CartProvider` → `WishlistProvider` → bridges → `Stack`.

### Per-library reference (runtime)

| Package | Version | Correct usage | Common mistakes |
|---------|---------|---------------|-----------------|
| `expo` | 56.0.12 | `expo start`, `expo run:android` | RN 0.86 with Expo 56 |
| `expo-router` | ~56.2.11 | `Stack`, `Tabs`, `useRouter` | Routes outside `src/app` |
| `expo-secure-store` | ~56.0.4 | JWT in SecureStore | AsyncStorage for tokens |
| `expo-notifications` | ~56.0.18 | Dynamic import; skip in Expo Go | Expect push in Expo Go |
| `@stripe/stripe-react-native` | ^0.64.0 | Dev/EAS build + PaymentSheet | Stripe in Expo Go |
| `@sentry/react-native` | 7.11.0 | `EXPO_PUBLIC_SENTRY_DSN` | Missing DSN → silent no-op |
| `@tanstack/react-query` | ^5.66.0 | Single `QueryClient` in root layout | Duplicate RQ in monorepo |
| `react-native-reanimated` | 4.3.1 | Import first in `_layout`; Babel plugin **last** | Wrong plugin order |
| `react-native-gesture-handler` | ~2.31.2 | **Import first** in entry (see gaps) | Missing entry import |
| `@repo/api-client` | workspace | `createMobileApiClient()`, `useApiQueryHooks()` | Forgetting `AuthTokenBridge` |

### API client pattern (`src/lib/api.ts`)

```typescript
export function createMobileApiClient(): ApiClient {
  return createApiClient({ baseURL: getApiBaseUrl(), getToken: () => getAuthTokenRef() });
}

export function useApiQueryHooks(): ApiQueryHooks {
  const baseURL = getApiBaseUrl();
  return useMemo(() => createQueryHooks(createMobileApiClient()), [baseURL]);
}
```

- Imperative calls (shipping quote, receipts, push): `createMobileApiClient()`.
- Screens with lists/detail: `useApiQueryHooks()`.

### Environment (`EXPO_PUBLIC_*` only — embedded in bundle)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Override API base (physical device = LAN IP) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe PaymentSheet |
| `EXPO_PUBLIC_SENTRY_DSN` | Crash reporting |
| `EXPO_PUBLIC_APP_ENV` | Sentry environment (`eas.json` profiles) |

**Never** ship secrets (`STRIPE_SECRET_KEY`, `AUTH_JWT_ACCESS_SECRET`) in mobile env.

### Android emulator networking

| Concern | Solution |
|---------|----------|
| API from emulator | `http://10.0.2.2:3001/v1` (default in `env.ts`) |
| HTTP cleartext | `usesCleartextTraffic: true` in `app.json` (dev only) |
| Metro | `adb reverse tcp:8081 tcp:8081` in `ensure-android-emulator.mjs` |
| Physical device | `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001/v1` |

### Expo Go vs development build

| Mode | Command | Works | Does not work |
|------|---------|-------|---------------|
| **Expo Go** | `pnpm start` | UI, API, cart, routing | Stripe native, push, full Sentry |
| **Dev client** | `pnpm dev:android` | All native modules | Requires `expo-dev-client` + EAS build |
| **Native run** | `pnpm android` | `expo run:android` | Slow first build |

### Monorepo Metro (`metro.config.js`)

- `watchFolders: [workspaceRoot]`
- `nodeModulesPaths` — app + root `node_modules`
- `resolveRequest` singleton for `react` and `@tanstack/react-query`

### Mobile commands

```bash
pnpm --filter @repo/mobile start:android   # emulator script + Metro
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/mobile health:expo
```

### Mobile gaps (resolved)

1. ✅ **`expo-dev-client`** — in `dependencies`; `app.json` plugin configured for Stripe/push dev builds.
2. ✅ **JWT refresh on 401** — `createMobileApiClient()` passes `onUnauthorized` → `performTokenRefresh()` in `src/lib/api.ts`.
3. ✅ **`react-native-gesture-handler` entry import** — `import 'react-native-gesture-handler'` first in `src/app/_layout.tsx`.
4. ✅ **`expo-notifications` plugin** — configured in `app.json`; set real `eas.projectId` for production push tokens.
5. ✅ **Cleartext HTTP** — `app.config.ts` enables `usesCleartextTraffic` only when `EXPO_PUBLIC_APP_ENV` is `development` (or unset locally).

---

## Cross-cutting concerns

### Authentication model

| App | Storage | Verification |
|-----|---------|--------------|
| **Web** | httpOnly cookies (`access_token`, `refresh_token`) | `middleware.ts` + `getSession()` + Server Actions |
| **Mobile** | `expo-secure-store` | `AuthTokenBridge` → Bearer on API client |
| **API** | JWT verify + refresh in DB | `JwtAuthGuard` global; `@Roles()` per route |

**Rule:** UI may hide by role; **API always re-validates**.

### TanStack Query v5 (web + mobile)

```typescript
// Module-level QueryClient — never inside a component
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Keys from factory only
queryKeys.catalog({ page: 1, limit: 48, sort: 'newest' })

// Auth-gated
enabled: !!userId

// After mutation
queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
```

| Anti-pattern | Fix |
|--------------|-----|
| Duplicate `react-query` in monorepo | pnpm overrides + Metro singleton (mobile) |
| Ad-hoc query key strings | `queryKeys` from api-client |
| `return null` in `queryFn` | `enabled: false` |
| New `QueryClient` per screen | One provider at root |

### Payments (Stripe)

- **Web:** Payment Element — fulfillment via webhook only.
- **Mobile:** PaymentSheet — same rule.
- **API:** Verify webhook signature on raw body; idempotency in Redis.

### Observability

| App | Tool |
|-----|------|
| API | Pino, Sentry (optional), PostHog (optional) |
| Web | PostHog + Clarity (consent-gated) |
| Mobile | Sentry (`initMobileSentry` in `_layout`) |

---

## Development workflow

```bash
# 1. Infrastructure
docker compose up -d

# 2. Packages (after shared code changes)
pnpm build

# 3. API
pnpm --filter @repo/api exec prisma generate
pnpm --filter @repo/api dev          # :3001/v1

# 4. Web
pnpm --filter @repo/web dev          # :3000

# 5. Mobile (Android emulator)
pnpm --filter @repo/mobile start:android

# Regenerate API client after Swagger changes (API must be running)
pnpm api-client:generate
pnpm --filter @repo/api-client openapi:check
```

### Health checks

```bash
pnpm health          # web + api + mobile doctors
curl http://localhost:3001/v1/health
```

---

## Known gaps (all apps)

| # | Area | Gap | Priority | Status |
|---|------|-----|----------|--------|
| 1 | Web auth | No `/api/auth/refresh` BFF for silent token rotation | High | ✅ Fixed — `app/api/auth/refresh` + `auth-refresh.ts` + middleware silent refresh |
| 2 | Mobile auth | No 401 → refresh flow | High | ✅ Fixed — `onUnauthorized` in `apps/mobile/src/lib/api.ts` |
| 3 | Mobile native | Missing `expo-dev-client` for Stripe/push dev | High | ✅ Fixed — dependency + `app.json` plugin |
| 4 | Web caching | Public catalog not using `'use cache'` / tags | Medium | ✅ Fixed — `public-catalog.ts` + `cacheComponents` |
| 5 | Web middleware | `/account/*` not edge-protected | Medium | ✅ Fixed — matcher `['/admin/:path*', '/account/:path*']` |
| 6 | API env | All provider secrets required at boot | Medium | ✅ Fixed — modular schemas + dev defaults |
| 7 | API lint | ESLint not configured in `apps/api` | Medium | ✅ Fixed — `apps/api/eslint.config.mjs` |
| 8 | Mobile security | Global cleartext HTTP flag | Medium (prod) | ✅ Fixed — `app.config.ts` dev-only cleartext |
| 9 | Testing | Thin E2E/unit vs large admin surface | Medium | ✅ Improved — auth refresh unit + E2E; expand incrementally |
| 10 | api-client | Hand-maintained `client.ts` vs generated OpenAPI | Low | ✅ Fixed — `generate.ts`, `openapi:check`, `pnpm api-client:generate`, pinned spec + checksum |

---

## Related docs

- [AGENTS.md](../AGENTS.md) — architecture, RBAC, SRI, env vars
- [DOCTOR-GUIDE.md](./DOCTOR-GUIDE.md) — health scripts
- [mobile-app-store-compliance.md](./mobile-app-store-compliance.md) — store policies
- [packages/api-client/API-VERSION.md](../packages/api-client/API-VERSION.md) — client versioning

---

*Last expanded: deep audit via codebase + Context7 (Next.js 16.2.9, NestJS, Expo). Update this doc when bumping major SDK versions.*
