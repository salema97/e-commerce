# E-commerce Monorepo — Agent Guide

## Project Overview

Full-stack e-commerce platform built as a TypeScript monorepo with integrated financial tracking.

- **API**: NestJS 11 REST API with Prisma ORM.
- **Web**: Next.js 15 App Router — landing page, customer store, admin panel, WhatsApp support inbox, and financial module.
- **Mobile**: Expo SDK 52 + React Native + Expo Router.
- **Messaging**: WhatsApp integration via Evolution API (Baileys provider for MVP, migration path to WhatsApp Cloud API).
- **Financials**: income, expense, supplier, and basic cash-flow tracking inside the admin panel.
- **Shared packages**: types, UI primitives, utilities, API client, and tooling configs.

## Tech Stack & Versions

| Layer | Technology | Version Notes |
|-------|------------|---------------|
| Workspace | pnpm 10.34.3 + Turborepo 2.9.18 | pnpm 11 blocked by Prisma 7 engine constraint |
| Runtime | Node.js 22.23.0 LTS | Satisfies all packages including Expo 56 |
| API | NestJS 11.1.27 + Prisma 7.8.0 + PostgreSQL + Redis | Prisma 7 requires driver adapters and `prisma.config.ts` |
| Web | Next.js 16.2.9 (App Router) + React 19.2.7 + Tailwind CSS 4.3.1 + shadcn/ui 4.11.0 | Async APIs, Turbopack default; auth/session via `middleware.ts` + httpOnly cookies |
| Mobile | Expo SDK 56.0.12 + React Native 0.85.3 + Expo Router | RN 0.86 is NOT compatible with Expo 56 |
| Shared | TypeScript 5.9.3 + Zod 4.4.3 | TS 6.x skipped until ecosystem catches up |
| State | TanStack Query (server) + Zustand (client) | React Query v5 object API |
| Auth | Native JWT + argon2 | Email/password login, refresh rotation in DB |
| Payments | Stripe (default for international cards) | Node SDK v22; never expose secret keys |
| Local payments (Ecuador) | Kushki / PayPhone / MercadoPago / PlaceToPay | Used for local bank cards, mobile money, and cash networks |
| E-invoicing (Ecuador) | Direct SRI integration via SOAP/XML | Self-hosted signing with `.p12` certificate; no intermediary fees |
| Search | Meilisearch | Engine 1.47+ |
| Storage | AWS S3 / MinIO | S3-compatible, signed URLs |
| Messaging | Evolution API + WhatsApp | Baileys provider (MVP) → WhatsApp Cloud API (scale) |
| Email | Resend / Loops / SendGrid | Transactional + marketing templates |
| Push notifications | Expo Notifications / OneSignal / Firebase Cloud Messaging | Segmentation and rich push |
| Error tracking | Sentry | Web, mobile, and API |
| Product analytics | PostHog / Plausible / GA4 | Consent-aware |
| Real-time analytics | Tinybird / ClickHouse / Supabase Analytics | E-commerce event analytics |
| Event streaming | Upstash Kafka / Redis Streams | Async event queues |
| AI / LLM | OpenAI / Anthropic Claude | Support bot, product descriptions, WhatsApp auto-replies, semantic search |
| Conversation orchestration | Dify / LangChain / Typebot | WhatsApp conversation flows |
| Multichannel inbox | Chatwoot | WhatsApp, email, web chat |
| Deploy | Vercel (web), Railway/Render/Fly.io (API), EAS (mobile), VPS/Docker (Evolution API) | |

## Architecture Decisions

- **Monorepo**: `apps/*` for deployable apps, `packages/*` for shared code. Apps depend on packages; packages never depend on apps.
- **State ownership**: TanStack Query owns server state; Zustand owns client-only state (cart UI, filters, checkout step).
- **API style**: REST + OpenAPI. `@repo/api-client` is generated from NestJS Swagger spec.
- **Auth model**: Native JWT auth with argon2 password hashes. Access tokens (JWT) + refresh tokens stored hashed in `AuthSession`. NestJS validates JWT via global `JwtAuthGuard`; roles live on `User.role`.
- **Checkout flow**: Stripe Checkout/Payment Element on web; Payment Intents on mobile. Fulfillment happens via verified webhooks only.
- **Search sync**: Prisma is source of truth; Meilisearch is updated asynchronously on product mutations.
- **Admin panel**: embedded inside the web app at `/admin` with role-based route protection. Includes WhatsApp support inbox.
- **Messaging**: Evolution API runs as a separate service. NestJS communicates via REST and receives events via webhooks. Provider strategy: Baileys for MVP (free, unofficial), WhatsApp Cloud API for scale (official, paid).
- **Payments**: `PaymentProvider` abstraction lets the checkout flow support Stripe plus Ecuador-local providers (Kushki, PayPhone, MercadoPago, PlaceToPay) without changing business logic. Stripe remains the default for international cards.
- **Promotions**: `PromotionEngine` abstraction drives coupons, discount rules, bundles, free-shipping thresholds, and tiered promotions.
- **Returns & warranties**: RMA (Return Merchandise Authorization) flow links return requests to SRI credit notes (nota de crédito 04) and refund methods (original payment, store credit, or exchange).
- **Audit logging**: every admin action that mutates data (create, update, delete, approve) must append an immutable `AuditLog` record with actor, timestamp, resource, action, and diff.
- **Bulk import/export**: products, orders, customers, and suppliers can be imported and exported via CSV/Excel templates with validation and row-level error reporting.
- **API versioning**: the public REST API is versioned from the start under `/v1/...` so future breaking changes can roll out behind `/v2/...`.
- **Resilience**: external calls to Stripe, SRI, Evolution API, email, and push providers use retries with exponential backoff and circuit breakers to avoid cascading failures.
- **CDN + caching**: static assets and product media are served through Cloudflare (or equivalent CDN). Redis caches hot reads (catalog, sessions, search results) with TTL and invalidation on mutations.
- **PWA / offline support**: the customer-facing web store is a Progressive Web App with a service worker, manifest, and offline cart/catalog browsing.
- **Mobile app store compliance**: iOS and Android builds follow Apple/Google review policies, in-app purchase (IAP) rules for digital goods, and location/notification permission guidelines.
- **CMS**: admins can edit content-managed pages (blog, legal pages, landing page sections) without code changes.
- **Gift cards / store credit**: future financial feature for refunds, loyalty rewards, and customer retention.
- **Wishlist + back-in-stock alerts**: customer features to save products and be notified when out-of-stock items return.
- **Multi-currency**: conditional feature; only required if selling outside Ecuador. Plan for currency formatting, conversion strategy, and rounding rules from the start. The platform UI and copy remain Spanish-only.
- **Granular rate limiting**: apply per endpoint, per IP, per user, and per API key using a sliding window or token bucket strategy. Public endpoints (login, register, forgot password, checkout, webhooks) get stricter limits than authenticated endpoints. Redis-backed counters with fallback to in-memory for local dev.
- **Public API documentation**: publish a versioned OpenAPI/Swagger spec at `/v1/docs`. Align generated `@repo/api-client` versions with API versions. Maintain a public change log and migration guides for API consumers.
- **Disaster recovery**: define RPO and RTO targets. Use automated PostgreSQL backups with point-in-time recovery (PITR), S3 object versioning for media, infrastructure-as-code for rebuilds, and documented runbooks for DB failure, API outage, and webhook provider downtime.
- **POS / BOPIS**: future omnichannel capability. Build a POS app/module for in-store sales with unified online/POS inventory, BOPIS checkout option, in-store pickup notifications, and receipt printing integration.
- **Pre-orders and back-in-stock**: support pre-order reservations before a product release date with configurable charge timing (at shipping or upfront). Back-in-stock alerts notify customers when out-of-stock items return.
- **Subscriptions / recurring billing**: integrate Stripe Billing. Support subscription products, plans, billing cycles, and customer self-service pause/cancel/upgrade. Generate invoices for recurring payments.
- **B2B quotes**: quote request flow from customer accounts, admin quote creation with negotiated pricing, quote approval/expiration, and conversion to a standard order.
- **Dropshipping**: allow supplier-specific fulfillment rules so suppliers can ship directly to customers. Track commission and markup per dropshipped order.
- **Internal marketplace**: support third-party seller accounts with their own products, inventory, and orders. Implement marketplace commission model, seller payouts, and dispute handling.

## Roles & Permissions (RBAC)

The platform uses a simple RBAC model. Roles are stored on `User.role` in Prisma.

### Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Full platform control: settings, users, roles, billing, all modules. |
| **Admin** | Manages products, categories, orders, customers, suppliers, promotions, and can view financial reports. |
| **Finance** | Manages income, expenses, suppliers, invoices, refunds, and financial reports. Cannot edit catalog or attend chats. |
| **Inventory Manager** | Manages products, stock, suppliers, and purchase orders. Cannot access payments, invoices, or support chats. |
| **Support Agent** | Views and responds to WhatsApp/email support conversations. Can view orders read-only to assist customers. |
| **Customer** | Shops, views own orders, edits profile and addresses. |
| **Guest** | Cart and checkout without an account. |

### Permission matrix

| Resource | Super Admin | Admin | Finance | Inventory | Support | Customer |
|----------|:-----------:|:-----:|:-------:|:---------:|:-------:|:--------:|
| Products / categories | ✅ | ✅ | ❌ | ✅ | ❌ | view |
| Inventory / stock | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Suppliers | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Orders | ✅ | ✅ | view | ❌ | view | own only |
| Invoices (SRI) | ✅ | ✅ | ✅ | ❌ | ❌ | own only |
| Refunds | ✅ | ✅ | ✅ | ❌ | ❌ | request |
| Income / expenses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financial reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Support inbox | ✅ | ✅ | ❌ | ❌ | ✅ | initiate as client |
| Customers | ✅ | ✅ | view | ❌ | view | own profile |
| Reports | ✅ | ✅ | financial | inventory | ❌ | ❌ |
| Settings / roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Role management

- Roles are stored on `User.role` in Prisma (seed assigns dev users per role).
- NestJS reads `userId` and `role` from the signed access JWT via `JwtAuthGuard`.
- Use a `@Roles(...)` decorator on controllers/methods to enforce access.
- Next.js reads the session from httpOnly cookies + `jose` in middleware; Server Components use `getSession()`.
- The UI may hide buttons/menus by role, but the backend always re-validates permissions.

## Third-party Integrations

Integrations are grouped by value/effort and planned phase. Prefer abstraction layers so providers can be swapped without changing business logic.

### High value, medium effort

| Integration | Purpose | Default choice | Abstraction |
|-------------|---------|----------------|-------------|
| Stripe | International card payments | Stripe | `PaymentProvider` |
| Kushki / PayPhone / MercadoPago / PlaceToPay | Ecuador-local bank cards, mobile money, cash networks | Provider chosen by region/fees | `PaymentProvider` |
| OpenAI / Anthropic Claude | Support bot, product descriptions, WhatsApp auto-replies, semantic search | OpenAI GPT-4o / Claude 3.5 Sonnet (evaluated per use case) | `LlmProvider` |
| Dify / LangChain / Typebot | WhatsApp conversation flow orchestration, agentic support workflows | Dify or LangChain for flexibility; Typebot for simple flows | `ConversationOrchestrator` |
| Chatwoot | Multichannel inbox: WhatsApp, email, web chat | Chatwoot self-hosted or managed | `InboxProvider` |
| OneSignal / Firebase Cloud Messaging | Advanced push notifications with segmentation, rich push, delivery tracking | OneSignal for cross-platform speed; FCM for cost control at scale | `PushNotificationProvider` |
| Resend / Loops / SendGrid | Transactional and marketing emails with templates, deliverability, and analytics | Resend for transactional; Loops for marketing | `EmailProvider` |
| Tinybird / ClickHouse / Supabase Analytics | Real-time e-commerce event analytics, funnels, aggregations | Tinybird for managed speed; ClickHouse for self-hosted scale | `AnalyticsEventStore` |

### High value, high effort

| Integration | Purpose | Default choice | Abstraction |
|-------------|---------|----------------|-------------|
| Multi-marketplace (Mercado Libre, Amazon, Shopify) | List products and sync orders across external channels | Phase 14; start with one channel | `MarketplaceChannelAdapter` |
| ERP / accounting (QuickBooks, Xero, Siigo, Alegra) | General ledger, invoices, inventory sync | Siigo / Alegra for Latin America; QuickBooks / Xero for US/Global | `AccountingProvider` |
| WMS / 3PL fulfillment (ShipBob, Amazon FBA, Redpack, etc.) | Warehouse operations, pick/pack/ship, tracking | Phase 11; choose provider by region and SKU velocity | `FulfillmentProvider` |
| Stripe Tax / TaxJar / Avalara | Automated tax calculation per jurisdiction | Stripe Tax if already on Stripe; TaxJar/Avalara for complex nexus | `TaxCalculator` |
| Affiliate / referral engine | Partner tracking, commissions, referral codes | Build core engine in-house; integrate with affiliate networks later | `ReferralEngine` |
| Loyalty / rewards program | Points, tiers, discounts, retention campaigns | Build core engine in-house; integrate with dedicated loyalty SaaS if needed | `LoyaltyEngine` |

### Medium value, low effort

| Integration | Purpose | Default choice | Abstraction |
|-------------|---------|----------------|-------------|
| Google Reviews / Trustpilot | Collect and display product/store reviews | Trustpilot for B2C; Google Reviews for local SEO | `ReviewPlatform` |
| Klaviyo / Mailchimp | Email marketing with segmentation, flows, and campaign analytics | Klaviyo for e-commerce; Mailchimp for simpler lists | `MarketingEmailProvider` |
| Hotjar / Microsoft Clarity | Heatmaps and session recordings for UX insights | Microsoft Clarity (free); Hotjar for richer features | `SessionRecordingProvider` |
| Sentry | Error tracking for web, mobile, and API | Sentry | `ErrorTracker` |
| PostHog | Product analytics, funnels, feature flags | PostHog | `ProductAnalyticsProvider` |
| Upstash Kafka / Redis Streams | Async event queues for webhooks, inventory, search sync | Redis Streams for local parity; Upstash Kafka for managed scale | `EventBus` |

## Monorepo Structure

```text
e-commerce/
├── apps/
│   ├── api/                  # NestJS REST API
│   ├── web/                  # Next.js: landing + store + admin panel + WhatsApp inbox
│   └── mobile/               # Expo React Native app
├── packages/
│   ├── shared-config/        # ESLint, Prettier, TS, Tailwind configs
│   ├── shared-types/         # DTOs, interfaces, API contracts (runtime-free)
│   ├── shared-utils/         # Helpers, formatters, Zod schemas
│   ├── shared-ui/            # Cross-platform UI primitives (react-native-web)
│   └── api-client/           # Generated API client + React Query hooks
├── .github/workflows/        # CI/CD
├── docker-compose.yml        # Postgres + Redis + Meilisearch + Evolution API for local dev
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json             # Root solution with project references
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Start a specific app
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev
pnpm --filter @repo/mobile start

# Build everything
pnpm build

# Lint / format
pnpm lint
pnpm format

# Type check
pnpm typecheck

# Database (API package)
pnpm --filter @repo/api prisma:migrate
dev
pnpm --filter @repo/api prisma:seed

# Run tests
pnpm test
pnpm test:e2e
```

## Conventions

- **NestJS**: organize by feature modules, use DTOs + `class-validator`, keep services focused. Use repositories or a single `PrismaService` per bounded context.
- **Next.js**: default to Server Components; use `'use client'` only for interactivity. Re-verify auth inside every Server Action and Route Handler.
- **Mobile**: screen components under `app/`, shared components under `components/`, API calls through `@repo/api-client`.
- **Shared packages**: always use `workspace:^` in `package.json` dependencies.
- **Validation**: use Zod schemas in `@repo/shared-utils`; reuse them on API DTOs and client forms.
- **API client**: generate from the OpenAPI spec exposed by NestJS Swagger.
- **API versioning**: all public REST endpoints must be prefixed with `/v1/` from the start.
- **Audit logging**: every mutating admin action must create an `AuditLog` record with actor, timestamp, resource, action, and a diff snapshot.
- **Environment variables**: use `.env.example` in each app/package; never commit secrets.
- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, etc.).
- **TypeScript**: use project references (`composite: true`) for buildable packages.

## WhatsApp & Evolution API

- Evolution API runs as a separate Docker service, not inside the monorepo.
- NestJS communicates with Evolution API via REST calls to send messages.
- Evolution API sends webhooks to NestJS for incoming messages, delivery status, and connection events.
- Provider strategy:
  - **MVP**: Baileys provider (free, unofficial). Use only for transactional notifications and 1-on-1 support.
  - **Scale**: WhatsApp Cloud API provider (official, paid per conversation). Enable marketing, abandoned cart, and sales bot flows.
- Build an abstraction (`WhatsAppProvider`) so the e-commerce code does not depend on Baileys specifics.
- Store conversations and messages in Prisma to power the admin inbox.
- Never use Baileys for bulk/marketing messaging; it violates WhatsApp ToS and risks number bans.

## Security Notes

- All API input must be validated (Zod + class-validator).
- Authentication uses native JWT access tokens (signed with `AUTH_JWT_ACCESS_SECRET`) and refresh tokens in `AuthSession`. Verify JWTs on protected routes; do not rely on client-provided `userId`.
- Re-verify authentication inside every Next.js Server Action and Route Handler.
- Granular rate limiting: per endpoint, per IP, per user, and per API key using sliding window / token bucket. Public endpoints (login, register, forgot password, checkout, webhooks) use stricter limits than authenticated endpoints.
- Stripe webhooks must validate signatures using the raw request body.
- Evolution API webhooks must validate the configured signature/token.
- CORS must be explicit; use Helmet + HSTS in production.
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options.
- Storage URLs must be signed or use strict access policies.
- Store mobile auth tokens in `expo-secure-store`, never AsyncStorage.
- Never expose `STRIPE_SECRET_KEY`, `AUTH_JWT_ACCESS_SECRET`, `EVOLUTION_API_KEY`, `SRI_INTERMEDIARY_API_KEY`, `SRI_DIGITAL_CERTIFICATE_PASSWORD`, or webhook secrets to clients.
- Use HTTPS/TLS everywhere; validate env secrets at boot with Zod.
- Dependency scanning and automated security patches in CI.

## Compliance Notes

- **PCI DSS**: never let raw card data touch your servers. Use Stripe Elements/Checkout. Complete the appropriate SAQ.
- **GDPR**: lawful basis for processing, privacy policy, data-subject rights (access, rectification, erasure, portability), breach-notification process, DPAs with vendors.
- **CCPA/CPRA**: privacy notice, opt-out of sale/sharing, consumer rights workflow.
- **WhatsApp / Meta**: when using Cloud API, comply with Meta Business Messaging policies and approved message templates.
- **WCAG 2.1 AA**: accessibility conformance for web and mobile.
- **Cookie consent**: granular preferences banner before loading trackers.
- **Terms of Service, Refund Policy, Return Policy**: required for dispute resolution and payment-processor approval.
- **Sales tax / VAT nexus**: consult a tax advisor; consider Stripe Tax, TaxJar, or Avalara before scaling to multiple jurisdictions.

## Ecuador Compliance & SRI

Ecuadorian operations require electronic invoicing through the SRI (Servicio de Rentas Internas). Treat this as a launch blocker for any order that ships inside Ecuador.

### Requirements

- **RUC**: company tax identification number registered with SRI.
- **Digital certificate**: `.p12` file issued by an SRI-approved CA.
- **SOL key**: SRI online-services password for web consultations and some intermediary flows.
- **Establishment + emission point**: physical establishment and authorized point-of-sale codes.
- **Authorized sequences**: invoice number ranges pre-authorized by SRI for each document type.

### Document types

| Code | Document | Notes |
|------|----------|-------|
| 01 | Factura | Standard sales invoice. |
| 04 | Nota de crédito | Refunds / returns against a prior invoice. |
| 05 | Nota de débito | Additional charges / corrections. |
| 06 | Guía de remisión | Shipping / transport authorization. |
| 07 | Comprobante de retención | Withholding tax certificate. |

### Flow

1. Order is paid and confirmed.
2. Generate XML per SRI specification.
3. Sign XML with the `.p12` digital certificate.
4. Submit to SRI test or production environment.
5. Poll/parse SRI authorization response and access key (`clave de acceso`).
6. Store XML, authorization number, and access key in Prisma.
7. Deliver PDF + XML to the customer via email and/or WhatsApp.

### Integration approach

- **Direct SRI integration (selected)**: the platform builds the XML invoice, signs it with the company's `.p12` digital certificate, and submits it directly to the SRI SOAP web services. This avoids per-invoice intermediary fees but requires XML/XSD expertise, certificate management, SOAP client setup, and ongoing maintenance when SRI updates schemas.

### SRI SOAP endpoints

| Environment | Recepción (submission) | Autorización (status) |
|-------------|------------------------|-----------------------|
| Test (cer) | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline` | `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline` |
| Production | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline` | `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline` |

### Required libraries

- `soap` — SOAP client for SRI web services.
- `fast-xml-parser` or `xml2js` — XML generation/parsing.
- `node-forge` or `@peculiar/xmldsig` — XML digital signature with `.p12` certificate.
- `xsd-schema-validator` or equivalent — optional XSD schema validation before submission.

### Abstraction

Introduce an `InvoiceProvider` port so the core e-commerce code does not depend directly on SRI SOAP specifics. A `DirectSriInvoiceProvider` implements the protocol, leaving room for a future intermediary adapter if needed.

## Testing Strategy

| Layer | Tooling | What to test |
|-------|---------|--------------|
| Shared packages | Vitest | Pure functions, Zod schemas, formatters |
| API services | Jest | Business logic, repositories (mocked) |
| API controllers | Jest + supertest | HTTP layer, auth guards, validation, webhooks |
| API E2E | Jest + test DB | Full request lifecycle |
| Web components | Vitest + React Testing Library | UI behavior, hooks |
| Web E2E | Playwright | Critical flows: login, add to cart, checkout, WhatsApp inbox |
| Mobile | Jest + React Native Testing Library | Component behavior |

- Use a separate test database for API E2E; reset between runs.
- Mock external services (Stripe, S3, Evolution API) in unit tests.
- Run E2E after build; disable Turborepo cache for E2E tasks.

## Deployment Notes

- Web deploys to Vercel via GitHub integration.
- API deploys as a Docker container or Node.js service; needs `DATABASE_URL` and `REDIS_URL`. Run migrations before starting new versions.
- Mobile builds via EAS (Expo Application Services).
- Evolution API deploys via Docker on a VPS or dedicated container service. Separate from the main API is recommended for production.
- Use GitHub Actions with pnpm caching, affected targets (`--affected`), and path-filtered deploy workflows.
- Use multi-stage Docker builds with `pnpm deploy --prod` for minimal production images.
- Never copy `.env` files into Docker images.

## Required Environment Variables

```bash
# Database & cache
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Search
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=dev-master-key

# Auth (native JWT — must match API AUTH_JWT_ACCESS_SECRET)
AUTH_JWT_ACCESS_SECRET=change-me-to-a-long-random-secret-32chars

# Payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Storage (AWS S3 / MinIO)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=e-commerce
AWS_S3_ENDPOINT=https://s3.example.com
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_PUBLIC_URL=https://s3.example.com/e-commerce

# Messaging (Evolution API)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=xxx
EVOLUTION_WEBHOOK_SECRET=whsec_xxx
EVOLUTION_INSTANCE_NAME=ecommerce

# Notifications / ops
RESEND_API_KEY=re_xxx
POSTHOG_KEY=phc_xxx

# Shipping, taxes & fulfillment (Phase 12)
SHIPPING_FREE_THRESHOLD=50
SHIPPING_FLAT_RATE=5
CARRIER_RATE_PROVIDER=zones
TAX_PROVIDER=composite
INTERNATIONAL_TAX_PROVIDER=stripe_tax
STRIPE_TAX_ENABLED=false
FULFILLMENT_PROVIDER=manual
WMS_PROVIDER=manual
ALLOW_BACKORDERS=false

# Catalog cache (Phase 13)
CATALOG_CACHE_TTL_SECONDS=120

# SRI Ecuador e-invoicing (direct integration)
SRI_MODE=direct
SRI_RUC=xxx
SRI_SOL_KEY=xxx
SRI_DIGITAL_CERTIFICATE_PATH=/path/to/cert.p12
SRI_DIGITAL_CERTIFICATE_PASSWORD=xxx
SRI_ESTABLISHMENT_CODE=001
SRI_EMISSION_POINT_CODE=001
SRI_TEST_ENVIRONMENT=true
```
