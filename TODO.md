# E-commerce Monorepo — Implementation Plan

## Decisions Log (defaults assumed)

- **Auth**: Native JWT (email/password, access + refresh tokens). Clerk is not used at runtime.
- **Admin panel**: inside the web app under `/admin`.
- **Mobile**: Expo development build (required for Stripe/push notifications).
- **API style**: REST + OpenAPI, client generated for web/mobile.
- **Checkout**: Stripe Checkout on web, Payment Intents on mobile, webhooks for fulfillment.
- **Search**: Meilisearch indexed from Prisma on product mutations.
- **State**: TanStack Query for server state, Zustand for client-only state.
- **Messaging**: Evolution API as separate service. Provider: Baileys (MVP, free) → WhatsApp Cloud API (scale, official).
- **WhatsApp use cases**: transactional notifications + support inbox in MVP; marketing/bot flows only with Cloud API.
- **SRI integration**: direct integration with SRI SOAP/XML services, signing XML with `.p12` certificate. No intermediary.
- **Versions (latest compatible)**: Node 22.23.0, pnpm 10.34.3, TypeScript 5.9.3, NestJS 11.1.27, Prisma 7.8.0, Next.js 16.2.9, React 19.2.7, Expo SDK 56.0.12, React Native 0.85.3, Tailwind 4.3.1, shadcn 4.11.0, Zod 4.4.3.
- **Language / market**: Spanish-only UI; Ecuador-only market at launch.
- **Team experience**: assumes TypeScript/React familiarity; moderate learning curve for NestJS/Next.js specifics.

---

## SDD Phase Mapping

SDD (Spec-Driven Development) is used for phases with high business risk, legal/compliance exposure, complex integrations, or many moving parts. Phases marked **SDD** require a written spec/proposal before implementation.

| Phase | SDD required | Reason |
|-------|:------------:|--------|
| Phase 0 — Monorepo Setup | ❌ | Mechanical setup; checklist is enough. |
| Phase 1 — API Core | ⚠️ Partial | SDD for RBAC/auth, `PaymentProvider`, and `InvoiceProvider` abstractions only. |
| Phase 2 — Shared Packages | ❌ | Small libraries with clear contracts. |
| Phase 3 — Web App | ❌ | Standard UI/CRUD; iterate quickly. |
| Phase 4 — Mobile App | ❌ | Standard e-commerce screens. |
| Phase 5 — Checkout & Payments | ✅ Yes | Financial risk, webhook idempotency, refunds, fraud. |
| Phase 5.5 — Returns, Warranties & RMA | ✅ Yes | Linked to SRI credit notes; complex business flow. |
| Phase 6 — WhatsApp Integration | ✅ Yes | Webhooks, signatures, human/bot handoff. |
| Phase 7 — SRI Direct Integration | ✅ Yes | Legal/compliance; XML/XSD/SOAP/firm digital exact behavior. |
| Phase 8 — Financial Module | ✅ Yes | Incomes, expenses, cash-flow, admin UI merged. |
| Phase 9 — Email/Push/Marketing | ✅ | Resend/Loops, push Expo/OneSignal, marketing automation, consent UI. |
| Phase 10 — AI & Conversational | ✅ Yes | Guardrails, RAG, human escalation. |
| Phase 11 — Advanced Analytics | ✅ | Merged `12427aa`; UI wiring verified post-merge. |
| Phase 12 — Shipping/Fulfillment | ⚠️ Partial | SDD for WMS/3PL integration if implemented. |
| Phase 13 — Search/Filters | ❌ | Standard Meilisearch usage. |
| Phase 14 — Reviews/Referrals/Loyalty | ❌ | Common low-risk features. |
| Phase 15 — Multi-marketplace/ERP/B2B | ✅ Yes | External channel sync, B2B quotes. |
| Phase 16 — Compliance/Security/Production | ✅ Yes | Security hardening, disaster recovery, compliance workflows. |
| Phase 17 — POS/Subscriptions/Dropshipping/Marketplace | ✅ Yes | Business-model-changing features. |

---

## Phase 0 — Monorepo Setup

- [ ] Initialize pnpm workspace (`pnpm-workspace.yaml`) with `apps/*` and `packages/*`.
- [ ] Add root `package.json` with `packageManager: pnpm@10.x` and Turborepo scripts.
- [ ] Add Turborepo pipeline (`turbo.json`) for `dev`, `build`, `lint`, `test`, `test:e2e`, `typecheck`.
- [ ] Create workspace packages: `shared-config`, `shared-types`, `shared-utils`, `shared-ui`, `api-client`.
- [ ] Configure TypeScript project references (`composite: true`, root solution `tsconfig.json`).
- [ ] Configure pnpm catalogs for shared versions (React, TypeScript, Zod, Tailwind, ESLint, Prettier).
- [ ] Use `workspace:^` for all internal dependencies.
- [ ] Configure ESLint 9 flat config + Prettier + Husky + lint-staged.
- [ ] Create `docker-compose.yml` with PostgreSQL, Redis, Meilisearch, and Evolution API.
- [ ] Add root `.env.example` and per-app `.env.example` files.
- [ ] Add GitHub Actions workflow: install, lint, typecheck, test, build on PR (with affected targets).
- [ ] Add path-filtered deploy workflows for API, web, and mobile.

## Phase 1 — API Core (`apps/api`)

> **SDD phase**: partial. SDD required for RBAC/auth, `PaymentProvider`, and `InvoiceProvider` abstractions only.

- [ ] Bootstrap NestJS 11 app inside `apps/api` (Node 20+).
- [ ] Configure Prisma with PostgreSQL.
- [ ] Define initial schema:
  - [ ] `User` (with native auth fields: email, `role`, phone, password hash)
  - [ ] `Category`
  - [ ] `Product`, `ProductVariant`, `ProductImage`, `ProductAttribute`
  - [ ] `Inventory`
  - [ ] `Cart`, `CartItem`
  - [ ] `Order`, `OrderItem`, `OrderStatusHistory`
  - [ ] `Payment`, `Refund`
  - [ ] `Promotion`, `Coupon`, `DiscountRule`
  - [ ] `Wishlist`, `BackInStockAlert`
  - [ ] `AuditLog`
  - [ ] `Address`
  - [ ] `Conversation`, `Message` (for WhatsApp support inbox)
  - [ ] `Supplier`
  - [ ] `Income`, `Expense`, `ExpenseCategory` (financial module)
- [ ] Add indexes on `slug`, `categoryId`, `status`, `userId`, `createdAt`, `customerPhone`.
- [ ] Run initial migration and seed script with sample data.
- [ ] Implement feature modules:
  - [ ] Auth (native JWT guard, public route decorator, role guard)
  - [ ] RBAC: `@Roles()` decorator + global RolesGuard reading `role` from JWT
  - [ ] Users (register/login, refresh tokens, `role` field in Prisma)
  - [ ] Categories (CRUD)
  - [ ] Products (CRUD with variants, attributes, images)
  - [ ] Inventory (stock levels, reservations, oversell prevention)
  - [ ] Suppliers (CRUD, linked to products/purchase orders)
  - [ ] Cart (guest + authenticated, merge on login)
  - [ ] Orders (create from cart, status lifecycle)
- [ ] Add Swagger/OpenAPI documentation and publish public versioned docs at `/v1/docs`.
- [ ] Add API versioning prefix (`/v1`) to the NestJS global route prefix.
- [ ] Version the generated `@repo/api-client` with API versions and publish change log / migration guides.
- [ ] Add Cloudflare R2 image upload endpoint (signed URLs).
- [ ] Add global exception filter, validation pipes, and health check endpoint.
- [ ] Implement granular rate limiting:
  - [ ] Per endpoint, per IP, per user, and per API key.
  - [ ] Sliding window or token bucket strategy backed by Redis.
  - [ ] Stricter limits for public endpoints (login, register, forgot password, checkout, webhooks) vs authenticated endpoints.
- [ ] Add structured logging (Pino).
- [ ] Add circuit breaker / retry pattern for external service calls (Stripe, SRI, Evolution API, email, push).
- [ ] Add `PaymentProvider` abstraction and Stripe adapter.
- [ ] Add local Ecuador payment provider adapters: Kushki, PayPhone, MercadoPago, PlaceToPay.
- [ ] Add `PromotionService` with coupon, discount rule, and bundle support.
- [ ] Add `AuditLogService` to record admin mutations with diff snapshots.
- [ ] Write unit tests for services and E2E tests for controllers.

## Phase 2 — Shared Packages

- [x] `shared-config`: ESLint, Prettier, TypeScript base configs, Tailwind config.
- [x] `shared-types`: pure TypeScript interfaces/DTOs (no runtime deps).
- [x] `shared-utils`: Zod schemas, price/date formatters, slug helpers, address validators.
- [x] `shared-ui`: button, input, card, badge, modal, chat-bubble primitives compatible with web and mobile.
- [x] `api-client`: generate fetch client from OpenAPI spec; add TanStack Query hooks.

## Phase 3 — Web App (`apps/web`)

- [ ] Bootstrap Next.js 15 with App Router, Tailwind, shadcn/ui.
- [ ] Setup native JWT auth provider; configure `middleware.ts` route protection.
- [ ] Landing page (`/`).
- [ ] Customer store:
  - [ ] Catalog page (`/store`) with filters, sorting, and Meilisearch integration.
  - [ ] Product detail page (`/store/[slug]`).
  - [ ] Cart page (`/cart`) using Zustand + server sync.
  - [ ] Checkout page (`/checkout`) with Stripe.
  - [ ] Order confirmation and order history pages.
  - [ ] Guest checkout flow.
- [ ] Admin panel (`/admin`):
  - [ ] Admin layout and route protection (role-based).
  - [ ] Middleware to validate admin roles before rendering admin routes.
  - [ ] UI hides menus/actions based on role.
  - [ ] Server Actions/Route Handlers re-validate role on every request.
  - [ ] Products CRUD with image upload.
  - [ ] Categories CRUD.
  - [ ] Inventory management.
  - [ ] Orders list, detail view, status updates, refunds.
  - [ ] Customers list and detail.
  - [ ] Simple dashboard with metrics.
- [ ] Add global layout, navigation, footer, error pages, loading states.
- [ ] Implement SEO basics: sitemap, robots, structured data, metadata.
- [ ] Add PWA setup: service worker, web manifest, offline cart/catalog browsing.
- [ ] Add wishlist UI (`/wishlist`, product detail toggle).
- [ ] Add CMS-driven pages: blog, legal pages, and editable landing page sections.

## Phase 4 — Mobile App (`apps/mobile`)

- [ ] Bootstrap Expo SDK 52 with development build.
- [ ] Setup Expo Router with tab navigation.
- [ ] Setup native JWT auth (`expo-secure-store` for tokens).
- [ ] Screens:
  - [ ] Home / landing
  - [ ] Catalog with search and filters
  - [ ] Product detail
  - [ ] Cart
  - [ ] Checkout with Stripe Payment Intents
  - [ ] Account / orders / saved addresses
- [ ] Integrate `@repo/api-client` and `@repo/shared-ui`.
- [ ] Secure token storage with `expo-secure-store`.
- [ ] Add push notification scaffolding (Expo Notifications).
- [ ] Deep linking for products, orders, password reset.

## Phase 5 — Checkout & Payments

> **SDD phase**: required. Financial risk, webhook idempotency, refunds, and fraud prevention must be specified before implementation.

- [ ] Stripe Checkout / Payment Element on web.
- [ ] Stripe React Native SDK on mobile (development build).
- [ ] Create Stripe Customers on user sign-up; store `stripeCustomerId` in Prisma.
- [ ] Implement `PaymentProvider` abstraction in `apps/api` with provider selection per order/region.
- [ ] Expand payment methods to include Ecuador-local providers: Kushki, PayPhone, MercadoPago, PlaceToPay.
- [ ] Idempotency keys on payment creation.
- [ ] Webhook handler for:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
- [ ] Update order statuses and decrement inventory in webhook handlers (async queue recommended).
- [ ] Promotion and coupon application at checkout.
- [ ] Refund flow (full and partial) from admin panel.
- [ ] Receipt generation.

## Phase 5.5 — Returns, Warranties & RMA

> **SDD phase**: required. Linked to SRI credit notes and complex business flow; spec required before implementation.

- [x] Prisma schema additions:
  - [x] `ReturnRequest` / `Rma` (order relation, reason, status, items, resolution)
  - [x] `ReturnItem` (product/variant, quantity, condition, refund value)
- [x] Customer return request flow from account/order detail.
- [x] Admin RMA management: list, approve, reject, request inspection, update status.
- [x] Link approved returns to SRI credit notes (nota de crédito 04).
- [x] Refund method options: original payment, store credit, or exchange.
- [x] Admin panel: `/admin/returns` list, detail, and resolution actions.
- [ ] Email/WhatsApp notifications for return status updates.

## Phase 6 — WhatsApp Integration (Evolution API)

> **SDD phase**: required. Webhooks, signature verification, and human/bot handoff must be specified before implementation.

> Part of **Launch MVP**: transactional WhatsApp notifications and basic support inbox.

### 6.1 Infrastructure & Setup

- [x] Add Evolution API service to `docker-compose.yml`.
- [x] Configure Evolution API instance, API key, and webhook URL.
- [x] Add `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_SECRET`, `EVOLUTION_INSTANCE_NAME` to env files.
- [x] Document provider strategy: Baileys for MVP, Cloud API for scale.

### 6.2 Backend Integration (NestJS)

- [x] Build `WhatsAppProvider` abstraction in `apps/api`.
- [x] Implement `EvolutionApiProvider` for send/receive operations.
- [x] Add `ConversationModule` and `MessageModule`.
- [x] Prisma schema for `Conversation` and `Message` entities.
- [x] Webhook endpoint `POST /webhooks/evolution/messages` to receive inbound messages.
- [x] Webhook handlers for:
  - [x] Inbound text messages
  - [~] Media messages (images, audio, documents) — schema ready; full download/render deferred.
  - [x] Delivery/read receipts
  - [x] Connection status events
- [x] Endpoint to send messages via Evolution API.
- [x] Endpoint to list conversations and messages.
- [x] Endpoint to update conversation status and assign agent.
- [x] Rate limiting and signature verification on Evolution webhooks.

### 6.3 Transactional Notifications

- [x] Order confirmation message.
- [x] Order shipped message with tracking.
- [x] Order delivered message.
- [x] Payment failure/retry message.
- [x] Refund confirmation message.
- [ ] Message templates configurable from admin panel — deferred to Phase 10/11.

### 6.4 Admin Support Inbox (`/admin/support`)

- [x] Chat list screen with filters (new, open, resolved, closed).
- [x] Chat detail view with message history.
- [x] Real-time or polling updates for new messages.
- [x] Input to send text responses.
- [x] Quick reply templates.
- [x] Conversation status management (open, in progress, resolved, closed).
- [x] Agent assignment.
- [ ] Internal notes visible only to agents — deferred to Phase 10/11.
- [x] Display delivery/read status.

### 6.5 Migration Path

- [x] Design `WhatsAppProvider` interface to support multiple backends.
- [x] Document steps to switch Evolution API provider from Baileys to WhatsApp Cloud API.
- [ ] Plan approved message templates for Cloud API — pending Cloud API migration decision.

## Phase 7 — SRI Ecuador Electronic Invoicing (Direct Integration)

> **SDD phase**: required. High legal/compliance risk; exact XML/XSD/SOAP behavior must be specified before implementation.
> **Launch blocker for Ecuador**: every paid order inside Ecuador MUST generate an authorized SRI invoice.

### 7.1 Infrastructure & Compliance Setup

- [x] Collect SRI credentials: RUC, digital certificate (`.p12`), SOL key, establishment code, emission point code.
- [x] Register authorized invoice sequences with SRI for document types 01, 04, 05, 06, 07.
- [x] Add SRI environment variables:
  - [x] `SRI_MODE=direct`
  - [x] `SRI_RUC`
  - [x] `SRI_SOL_KEY`
  - [x] `SRI_DIGITAL_CERTIFICATE_PATH`
  - [x] `SRI_DIGITAL_CERTIFICATE_PASSWORD`
  - [x] `SRI_ESTABLISHMENT_CODE`
  - [x] `SRI_EMISSION_POINT_CODE`
  - [x] `SRI_TEST_ENVIRONMENT=true`
- [x] Validate SRI env secrets at API boot with Zod.

### 7.2 Required Dependencies

- [x] Install `soap` for SRI SOAP web service client.
- [x] Install `fast-xml-parser` or `xml2js` for XML generation/parsing.
- [x] Install `node-forge` or `@peculiar/xmldsig` for XML digital signature with `.p12` certificate.
- [~] Install `xsd-schema-validator` (optional) for XSD schema validation before submission — optional validation not wired.

### 7.3 Domain Model & Abstraction

- [x] Define `InvoiceProvider` port/interface in `apps/api`.
- [x] Implement `DirectSriInvoiceProvider`.
- [x] Keep abstraction open for a future intermediary adapter if needed.
- [x] Prisma schema additions:
  - [x] `Invoice` (order relation, access key, authorization number, status, XML/PDF URLs)
  - [x] `InvoiceSequence` (per document type, current number, authorized range)
  - [x] `CreditNote`, `DebitNote`, `ShippingGuide`, `WithholdingVoucher` as needed — `CreditNote` implemented; 05/06/07 deferred.

### 7.4 XML Generation & Signing

- [x] Build SRI-compliant XML for each document type per official schema (v2.32 offline).
- [x] Compute VAT, discounts, totals per SRI rules.
- [x] Generate access key (`clave de acceso`) from date/RUC/type/sequence.
- [x] Sign XML with `.p12` certificate using XAdES-EPES.
- [~] Optional: validate generated XML against SRI XSD before submission — not wired.

### 7.5 SOAP Submission & Authorization

- [x] Configure SRI endpoints:
  - [x] Test: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline`
  - [x] Test: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline`
  - [x] Production: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline`
  - [x] Production: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline`
- [x] Submit signed XML to `RecepcionComprobantesOffline`.
- [x] Parse reception response (status: RECIBIDA / DEVUELTA / NO PROCESADA).
- [x] Poll `AutorizacionComprobantesOffline` by access key until authorized or rejected.
- [x] Handle SRI error codes and messages.
- [x] Retry policy with exponential backoff for transient SRI failures.

### 7.6 Invoice Generation Flow

- [x] Trigger invoice creation on `checkout.session.completed` / `payment_intent.succeeded` webhook for Ecuador orders.
- [x] Async queue recommended: do not block checkout on SRI latency.
- [x] Store XML, PDF (RIDE), authorization number, and access key in Prisma.

### 7.7 Document Types

- [x] Factura (01) — standard sales invoice.
- [x] Nota de crédito (04) — refunds / returns linked to a prior invoice.
- [ ] Nota de débito (05) — additional charges / corrections — deferred.
- [ ] Guía de remisión (06) — shipping / transport authorization — deferred.
- [ ] Comprobante de retención (07) — withholding tax certificate — deferred.

### 7.8 Delivery & Admin

- [x] Generate RIDE PDF from authorized XML.
- [x] Deliver PDF + XML to customer via email and WhatsApp.
- [x] Admin panel: list invoices per order, view authorization status, retry failed submissions.
- [x] Error handling and retry policy for SRI rejections.

## Phase 8 — Financial Module

> **SDD phase**: completed (merged to `main`). Accounting impact, audit trails, and cash-flow logic implemented for MVP scope.
> Accessible by **Super Admin**, **Admin**, and **Finance** roles only.

### 8.1 Domain Model

- [x] Prisma schema (existing models used): `Supplier`, `Income`, `Expense`, `ExpenseCategory`
- [x] `Income.relatedOrderId` FK → `Order` (migration `20260629000000_phase8_income_order_fk`)
- [ ] `PurchaseOrder` (optional — deferred)
- [x] `StoreCredit` read-only listing in finance reports (existing returns module)
- [ ] `GiftCard` CRUD (deferred)

### 8.2 Backend (NestJS)

- [x] `FinanceModule` with incomes, expense categories, expenses, reports, store credits
- [x] CRUD endpoints for incomes, expenses, expense categories
- [x] Cash-flow report `GET /v1/finance/reports/cash-flow`
- [x] Expense receipt upload to R2 (base64)
- [x] RBAC: `SUPER_ADMIN`, `ADMIN`, `FINANCE`; suppliers GET restricted
- [x] Audit logging on finance mutations
- [ ] Gift card / store credit CRUD (deferred — read-only list only)
- [ ] Bulk import/export CSV (deferred)

### 8.3 Admin Panel (Next.js)

- [x] `/admin/finance` — hub with section cards (neo admin shell)
- [x] `/admin/finance/incomes` — income CRUD and listing (SSR + `initialData`)
- [x] `/admin/finance/expenses` — expense CRUD and listing
- [x] `/admin/finance/suppliers` — supplier listing (read)
- [x] `/admin/finance/reports` — cash-flow + store credit table
- [x] `/admin/finance/categories` — expense categories
- [x] Route-level RBAC via `finance/layout.tsx` + native JWT auth
- [x] Finance menu in `admin-nav.ts` (sidebar icon: Finanzas)

## Phase 9 — Email, Push Notifications & Marketing Automation

### 9.1 Email Infrastructure

- [x] Choose email provider: Resend (transactional default), Loops (marketing default), or SendGrid.
- [x] Add provider env vars (`RESEND_API_KEY`, `LOOPS_API_KEY`, etc.).
- [x] Build `EmailProvider` abstraction in `apps/api`.
- [x] Implement provider-specific transport with template support.
- [x] Shared email templates in `@repo/shared-utils` or a new `shared-email-templates` package.

### 9.2 Transactional Emails

- [x] Order confirmation with invoice PDF attachment (order summary PDF; SRI RIDE se envía aparte).
- [x] Shipping confirmation with tracking link.
- [x] Delivery confirmation.
- [x] Payment failure / retry.
- [x] Refund confirmation.
- [x] Password reset and account verification (native JWT flow).
- [x] Abandoned-cart reminder.
- [x] Back-in-stock alert emails for subscribed customers.

### 9.3 Push Notifications

- [x] Evaluate Expo Notifications (MVP) vs OneSignal / FCM (scale).
- [x] Build `PushNotificationProvider` abstraction.
- [x] Implement mobile token registration and storage in Prisma.
- [x] Send push for order status updates, shipping, promotions.
- [x] Segmentation by user role, purchase history, cart status.
- [x] Rich push support (images, deep links).
- [x] Back-in-stock alert pushes.

### 9.4 Marketing Automation

- [x] Klaviyo or Mailchimp integration for campaigns and flows (Loops provider + console stub; extensible port).
- [x] Build `MarketingEmailProvider` abstraction.
- [x] Sync customer segments and purchase events.
- [x] Abandoned-cart and win-back flows.
- [x] Promo code distribution and tracking.
- [x] Promotional email segmentation by purchase history, cart status, and cohort.
- [x] Consent and unsubscribe handling.

## Phase 10 — AI & Conversational Experiences

> **SDD phase**: required. Guardrails, RAG pipeline, and human escalation must be specified before implementation.

### 10.1 LLM Provider Abstraction

- [x] Choose default LLM: OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet (evaluate per task).
- [x] Add `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` env vars.
- [x] Build `LlmProvider` port in `apps/api`.
- [x] Implement `OpenAiProvider` and `AnthropicProvider` adapters.
- [x] Add guardrails: prompt injection filtering, PII redaction, max tokens, timeout, retries.

### 10.2 Support Bot

- [x] RAG pipeline over product catalog, FAQ, and policies.
- [x] Answer common support questions via WhatsApp and web chat.
- [x] Escalate to human agent when confidence is low or user requests it.
- [x] Log bot conversations for quality review.

### 10.3 Product Content

- [x] Generate product descriptions from attributes/images.
- [x] Generate SEO metadata and alt text.
- [x] Admin review/approval workflow before publishing generated content.

### 10.4 WhatsApp Conversation Orchestration

- [x] Choose orchestrator: Dify, LangChain, or Typebot (native default; Dify/Typebot stubs with fallback).
- [x] Build `ConversationOrchestrator` abstraction.
- [x] Implement flows for order status, returns, FAQs, and sales assistance (native inbox handoff).
- [x] Handoff to Chatwoot/admin inbox when human intervention is needed.

### 10.5 Semantic Search

- [x] Generate product embeddings with LLM.
- [x] Store embeddings in vector-capable store (pgvector, Pinecone, etc.) — JSON embeddings + cosine in API.
- [x] Implement natural-language product search endpoint.
- [x] Combine semantic results with Meilisearch keyword results.

## Phase 11 — Advanced Analytics & Event Tracking

### 11.1 Product Analytics

- [x] Integrate PostHog (default) or Plausible / GA4 with consent-aware loading.
- [x] Track events: product_view, add_to_cart, remove_from_cart, begin_checkout, purchase, search, filter.
- [x] Build funnels: catalog → product → cart → checkout → purchase.
- [x] Feature flags for gradual rollouts.

### 11.2 Error Tracking

- [x] Integrate Sentry for web, mobile, and API.
- [x] Capture unhandled exceptions, API errors, and performance transactions.
- [x] Source maps and release tagging.

### 11.3 Session Recording & Heatmaps

- [x] Integrate Hotjar or Microsoft Clarity.
- [x] Record sessions and generate heatmaps for key flows.
- [x] Respect cookie-consent preferences.

### 11.4 Real-time Event Analytics

- [x] Choose event store: Tinybird (managed default), ClickHouse (self-hosted), or Supabase Analytics.
- [x] Build `AnalyticsEventStore` abstraction.
- [x] Stream e-commerce events via Upstash Kafka or Redis Streams.
- [x] Dashboard queries: revenue, orders, conversion rate, top products, cohort retention.

### 11.5 Event Bus

- [x] Implement `EventBus` abstraction backed by Redis Streams (local) or Upstash Kafka (production).
- [x] Publish events: `order.paid`, `order.shipped`, `product.updated`, `inventory.changed`.
- [x] Consumers: Meilisearch sync, SRI invoice, email, push, analytics.

## Phase 12 — Shipping, Taxes, Fulfillment & WMS/3PL

> **SDD phase**: partial. SDD required for WMS/3PL integration if implemented.

### 12.1 Shipping

- [ ] Shipping zones (domestic, international, exclusions).
- [ ] Address validation at checkout.
- [ ] Carrier rate calculation (Shippo / EasyPost / ShipEngine).
- [ ] Fulfillment status tracking and tracking number.
- [ ] Customer-facing tracking page.
- [ ] Returns / RMA initiation flow.
- [ ] Returns shipping / reverse logistics integration.
- [ ] Backorder and split shipment handling.

### 12.2 Taxes

- [ ] Tax calculation at checkout based on shipping address.
- [ ] Tax categories (standard, reduced, zero, exempt).
- [ ] Integrate Stripe Tax, TaxJar, or Avalara before multi-jurisdiction scaling.
- [ ] Build `TaxCalculator` abstraction to support multiple providers.

### 12.3 Fulfillment & WMS/3PL

- [ ] Define `FulfillmentProvider` port.
- [ ] Evaluate WMS/3PL providers by region and SKU velocity (ShipBob, Amazon FBA, Redpack, etc.).
- [ ] Implement order allocation, pick/pack/ship workflows.
- [ ] Sync inventory levels from WMS to Prisma.
- [ ] Import tracking numbers and fulfillment events from 3PL.
- [ ] Admin panel: fulfillments list, create shipment, print labels, RMA handling.

## Phase 13 — Search, Filters & Performance

- [ ] Index products in Meilisearch.
- [ ] Configure `searchableAttributes`, `filterableAttributes`, `sortableAttributes`, `rankingRules`.
- [ ] Build faceted filters (category, price range, brand, rating, attributes).
- [ ] Typo tolerance and synonyms.
- [ ] Optimize images with Next.js Image and CDN transforms.
- [ ] Add Redis caching for hot queries.
- [ ] Add database query optimization and N+1 prevention.
- [ ] Add bundle analysis for web/mobile.
- [ ] Core Web Vitals optimization.

## Phase 14 — Reviews, Referrals & Loyalty

### 14.1 Reviews

- [ ] Integrate Google Reviews or Trustpilot for store/social proof.
- [ ] Build in-house product review system (ratings, text, verified purchase badge).
- [ ] Admin moderation workflow.
- [ ] Display reviews on product detail pages with structured data.

### 14.2 Referrals

- [ ] Design `ReferralEngine` in core codebase.
- [ ] Generate unique referral codes/links per customer.
- [ ] Track conversions and attribute commissions.
- [ ] Payout workflow (store credit or external payment).
- [ ] Admin dashboard for referral performance.

### 14.3 Loyalty & Rewards

- [ ] Design `LoyaltyEngine` in core codebase.
- [ ] Points accrual rules (purchase, review, referral, signup).
- [ ] Tier levels and associated benefits.
- [ ] Redemption at checkout (discounts, free shipping).
- [ ] Expiration and fraud prevention rules.

### 14.4 Pre-orders & Back-in-stock

- [ ] Pre-order flow: reserve stock before release date with configurable charge timing (at shipping or upfront).
- [ ] Back-in-stock alerts for subscribed customers via email, push, and WhatsApp.

## Phase 15 — Multi-marketplace, ERP/Accounting, B2B & Multi-currency

> **SDD phase**: required. External channel sync, B2B quotes, and negotiated pricing must be specified before implementation.

### 15.1 Multi-marketplace

- [ ] Design `MarketplaceChannelAdapter` port.
- [ ] Start with one channel (Mercado Libre, Amazon, or Shopify).
- [ ] Sync product catalog, inventory, and pricing to marketplace.
- [ ] Import marketplace orders into Prisma order pipeline.
- [ ] Handle marketplace-specific fees and shipping rules.
- [ ] Unified inventory reservation across channels.

### 15.2 ERP / Accounting

- [ ] Design `AccountingProvider` port.
- [ ] Choose provider by region: Siigo / Alegra (Latin America), QuickBooks / Xero (US/Global).
- [ ] Sync customers, invoices, payments, and chart of accounts.
- [ ] Push SRI-authorized invoices to accounting system.
- [ ] Reconcile payouts and fees.

### 15.3 B2B Features

- [ ] Company accounts with multiple users and roles.
- [ ] Tiered / negotiated pricing per company.
- [ ] Credit limits and net-payment terms.
- [ ] Bulk order CSV upload.
- [ ] Purchase order number capture and approval workflow.

### 15.4 B2B Quotes

- [ ] Quote request flow from customer account.
- [ ] Admin quote creation with negotiated pricing.
- [ ] Quote approval and expiration logic.
- [ ] Convert approved quote to order.

### 15.5 Multi-currency (conditional)

- [ ] Multi-currency pricing and checkout (only required if selling outside Ecuador).
- [ ] Currency conversion strategy and rounding rules.

## Phase 16 — Compliance, Security Hardening & Production Readiness

> **SDD phase**: required. Security hardening, disaster recovery, and compliance workflows must be specified before implementation.

### 16.1 Compliance

- [ ] Privacy policy, Terms of Service, Refund/Return policies.
- [ ] GDPR data-subject rights workflow (export/delete user data).
- [ ] CCPA opt-out workflow.
- [ ] DPAs with Stripe, Vercel, Cloudflare, Evolution API, email, push, and analytics vendors.
- [ ] WCAG 2.1 AA audit and fixes.
- [ ] Cookie consent banner with granular preferences.

### 16.2 Security Hardening

- [ ] Security headers (CSP, HSTS, etc.) in Next.js and NestJS.
- [ ] CORS explicit allowlists; Helmet + HSTS in production.
- [ ] WAF / DDoS protection (Cloudflare).
- [ ] Fraud detection (Stripe Radar).
- [ ] Bot protection (reCAPTCHA Enterprise / hCaptcha) on public forms.
- [ ] Admin MFA enforcement.
- [ ] Dependency scanning and automated security patches in CI.
- [ ] Penetration test before public launch.

### 16.3 Production Readiness

- [ ] Environment-specific configs (dev/staging/prod).
- [ ] Structured logging, monitoring, and alerting.
- [ ] Database migration strategy for zero-downtime deploys.
- [ ] Deploy web to Vercel.
- [ ] Deploy API to Railway/Render/Fly.io with Docker.
- [ ] Deploy Evolution API to VPS/dedicated container service.
- [ ] Configure EAS builds for mobile (dev + prod profiles).
- [ ] Run end-to-end smoke tests on staging.
- [ ] Load test checkout, catalog, WhatsApp webhook, and SRI invoice endpoints.
- [ ] Add CDN + caching strategy (Cloudflare + Redis) for static assets, product media, catalog, and search results.
- [ ] Mobile app store compliance checklist: review policies, IAP rules for digital goods, location/notification permissions.
- [ ] PWA testing: service worker, offline cart/catalog, manifest, install flow.

### 16.4 Disaster Recovery

- [ ] Define RPO (Recovery Point Objective) and RTO (Recovery Time Objective).
- [ ] Automated PostgreSQL backups with point-in-time recovery (PITR).
- [ ] R2/S3 object versioning for media and attachments.
- [ ] Infrastructure-as-code for quick environment rebuild.
- [ ] Runbooks for common incidents: DB failure, API outage, webhook provider down.

---

## Phase 17 — POS, Subscriptions, Dropshipping & Internal Marketplace

> **SDD phase**: required. Business-model-changing features must be specified before implementation.

### 17.1 POS & BOPIS

- [ ] POS app/module for in-store sales.
- [ ] Unified inventory between online store and POS.
- [ ] BOPIS checkout option.
- [ ] In-store pickup notifications.
- [ ] Receipt printing integration.

### 17.2 Subscriptions / Recurring Billing

- [ ] Stripe Billing integration.
- [ ] Subscription products and plans.
- [ ] Billing cycles and renewal logic.
- [ ] Customer self-service: pause, cancel, upgrade.
- [ ] Invoice generation for recurring payments.

### 17.3 Dropshipping

- [ ] Supplier ships directly to customer.
- [ ] Supplier-specific fulfillment rules.
- [ ] Commission and markup tracking.

### 17.4 Internal Marketplace

- [ ] Seller accounts with own products, inventory, and orders.
- [ ] Marketplace commission model.
- [ ] Seller payouts.
- [ ] Dispute handling.

---

## Launch Blockers

| Item | Why it blocks |
|------|---------------|
| PCI DSS scope reduction | Card data must never touch your servers; use Stripe tokenization. |
| Stripe webhook signature verification | Missing verification lets attackers fake payment events. |
| JWT validation in API + Server Actions | Prevents auth bypass and data leaks. |
| Granular rate limiting on login/register/checkout/webhooks | Prevents credential stuffing, carding, and abuse. |
| Evolution API webhook signature verification | Prevents fake inbound messages. |
| **SRI Ecuador e-invoicing (for Ecuador orders)** | Ecuadorian law requires authorized electronic invoices for every paid order; missing this blocks legal fulfillment. |
| **SRI credentials and certificate** | RUC, `.p12` certificate, SOL key, establishment/emission codes, and authorized sequences are required to issue valid invoices. |
| **Ecuador-local payment methods (conditional)** | If the target market is Ecuador, local bank cards/mobile money/cash networks (Kushki, PayPhone, MercadoPago, PlaceToPay) are required for broad checkout adoption. |
| **Admin audit logging** | Security/compliance requirement to track who changed what and when for mutating admin actions. |
| GDPR / CCPA compliance | Privacy policy, lawful basis, data-subject rights, DPAs. |
| Sales-tax / VAT nexus | Wrong collection can create penalties; consult a tax advisor. |
| Terms / Refund / Return policies | Required for dispute resolution and payment-processor approval. |
| WCAG 2.1 AA accessibility | Reduces ADA litigation risk. |
| HTTPS + security headers everywhere | Basic security baseline. |

---

## Launch MVP Definition

The minimum set of capabilities required to launch the Ecuador e-commerce operation:

- Catalog and product detail (Phase 3).
- Cart and guest/authenticated checkout (Phases 1, 3, 5).
- Stripe payments with webhook fulfillment (Phase 5).
- SRI electronic invoicing for every paid Ecuador order (Phase 7).
- Basic admin panel: products, categories, orders, invoices (Phases 1, 3, 7).
- Transactional WhatsApp and email notifications (Phases 6, 8).
- Native JWT authentication with role-based admin access (Phases 1, 3).
- Security baseline: HTTPS, JWT validation, webhook signature verification, granular rate limiting (Phases 1 and 16).

Stripe is the MVP payment method. Local Ecuador payment methods (Kushki, PayPhone, MercadoPago, PlaceToPay) should be added before full public launch if the primary target market is Ecuador.

Everything else (AI, advanced analytics, marketplaces, ERP, WMS, loyalty, referrals) is post-launch.

---

## Next Immediate Actions

1. ✅ Confirmed: market is Ecuador only, platform is Spanish-only.
2. ✅ Confirmed: use latest compatible versions (Option A): Node 22.23.0, pnpm 10.34.3, TypeScript 5.9.3, NestJS 11.1.27, Prisma 7.8.0, Next.js 16.2.9, React 19.2.7, Expo SDK 56.0.12, React Native 0.85.3, Tailwind 4.3.1, shadcn 4.11.0, Zod 4.4.3.
3. ✅ Confirmed: SRI integration is **direct** (SOAP/XML, `.p12` signing, no intermediary).
4. Initialize the monorepo (Phase 0).
5. Bootstrap the NestJS API and Prisma schema (Phase 1).
