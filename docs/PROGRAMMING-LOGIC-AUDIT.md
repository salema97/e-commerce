# Auditoría de lógica de programación — Web, API y Móvil

**Proyecto:** e-commerce monorepo  
**Alcance:** `main` desde núcleo (fases 0–6) hasta **fase 14 (reviews, referrals, loyalty)**  
**Fecha:** junio 2026  
**Complementa:** [`MERGE-GUIDE-FRONTEND.md`](./MERGE-GUIDE-FRONTEND.md), [`AGENTS.md`](../AGENTS.md), [`TODO.md`](../TODO.md)

---

## 1. Propósito

Este documento define **una sola lógica de programación, diseño y estructura** para las tres apps desplegables (`apps/api`, `apps/web`, `apps/mobile`). Cuando un módulo hace las cosas de otra forma, se marca como **desviación** y se indica si debe alinearse al patrón mayoritario.

**Regla de oro:** si el 80 % del código hace X, el 20 % restante debería hacer X salvo excepción documentada (p. ej. carrito en Zustand, checkout Stripe en cliente).

---

## 2. Mapa de fases y responsabilidad por app

| Fase | Tema | API | Web | Mobile |
|------|------|:---:|:---:|:------:|
| 0–1 | Monorepo, Prisma, RBAC, REST `/v1` | ✅ | — | — |
| 2 | `shared-types`, `shared-utils`, `api-client` | — | ✅ | ✅ |
| 3 | Tienda + admin shell | parcial | ✅ | ✅ |
| 4 | App móvil Expo | — | — | ✅ |
| 5 | Checkout, pagos, webhooks | ✅ | ✅ | ✅ |
| 5.5 | Devoluciones / RMA | ✅ | ✅ | ✅ |
| 6 | WhatsApp / soporte | ✅ | ✅ | — |
| **7** | **SRI directo (facturas, cola, PDF)** | ✅ | ✅ admin | recibo PDF |
| **8** | **Finanzas** | ✅ | ✅ admin | crédito lectura |
| **9** | **Email, push, marketing** | ✅ | ✅ cuenta + marketing admin | ✅ prefs + push |
| **10** | **AI, RAG, chat, knowledge** | ✅ | ✅ store + admin | ✅ chat tienda |
| **11** | **Analytics, event bus, consent** | ✅ | ✅ tracking + dashboard | ✅ tracking parcial |
| **12** | **Shipping, taxes, fulfillment/WMS** | ✅ | ✅ checkout + admin + tracking | — (API-only) |
| **13** | **Search, filters, catalog cache** | ✅ | ✅ faceted store SSR | ✅ useCatalog + prefetch |
| **14** | **Reviews, referrals, loyalty, pre-orders** | ✅ | ✅ PDP + admin + checkout | ✅ PDP + cuenta + filtros |

---

## 3. Lógica canónica transversal (las tres apps)

### 3.1 Contratos y paquetes compartidos

| Capa | Paquete | Uso canónico |
|------|---------|--------------|
| Tipos runtime-free | `@repo/shared-types` | DTOs, enums, `Role`, eventos analytics |
| Validación / formatos | `@repo/shared-utils` | Zod schemas, `formatPrice`, `neo-motion`, imágenes producto |
| Cliente HTTP + React Query | `@repo/api-client` | `createApi()` → `{ client, hooks }`; `queryKeys` centralizados |
| UI cross-platform | `@repo/shared-ui` | `Button`, `Card`, `ProductImage`, tokens `neo.*` (móvil) |
| Config | `@repo/shared-config` | ESLint, TS, Tailwind |

**Patrón:** las apps **nunca** duplican tipos de dominio; si el API expone un recurso, primero va a `shared-types` y luego a `api-client` (`client.ts` + `hooks.ts`).

### 3.2 Autenticación — JWT nativo (NO Clerk)

> **Decisión vigente en `main`:** auth nativo con email/password, JWT access + refresh en DB.  
> **Clerk quedó obsoleto** en runtime; solo persisten restos de dependencia/copy.

| App | Patrón canónico |
|-----|-----------------|
| **API** | `JwtAuthGuard` + `RolesGuard` globales; `@Public()` en login/webhooks; `@Roles(...)` en admin; rol en JWT `public_metadata` → `User.role` |
| **Web** | Cookies httpOnly (`access_token`) vía `/api/auth/login`; `getSession()` / `middleware.ts` verifican JWT con `AUTH_JWT_ACCESS_SECRET`; cliente: `AuthProvider` + `useAuth()` |
| **Mobile** | `AuthProvider` + `expo-secure-store`; `AuthTokenBridge` inyecta token en `lib/api.ts` |

**Invariante crítica (aprendida en merges):**

```text
apps/api/.env  AUTH_JWT_ACCESS_SECRET  ===  apps/web/.env.local  AUTH_JWT_ACCESS_SECRET
```

Si difieren: login “funciona” en cliente (`/api/auth/me` llama al API) pero **SSR y middleware redirigen a `/sign-in`** porque `jose` no valida el token.

**Pre-merge auth:**

- [x] Eliminar `@clerk/nextjs` de `apps/web/package.json` si no hay imports
- [x] Buscar `@clerk` en mobile/web: sin referencias en runtime
- [ ] Mismo `AUTH_JWT_ACCESS_SECRET` en API, web y documentado en ambos `.env.example`
- [ ] Seed users: `store-admin@`, `finance@`, `support@`, `cliente@` + `SeedDemo123!`

### 3.3 API REST y cliente

| Regla | Detalle |
|-------|---------|
| Prefijo | `app.setGlobalPrefix('v1')` — rutas en controllers **sin** `/v1` |
| Web servidor | `getServerApiClient()` lee cookie JWT (`apps/web/src/lib/api.ts`) |
| Web cliente | `useApiClient()` + `useApiQueryHooks()` (`apps/web/src/lib/client-api.ts`) |
| Mobile | Singleton `api = createApi({ getToken })` (`apps/mobile/src/lib/api.ts`) |
| Hooks | Preferir `api.hooks.useX()` generados en `packages/api-client/src/hooks.ts` |

### 3.4 Estado

| Tipo | Herramienta | Dónde |
|------|-------------|-------|
| Servidor | TanStack Query | Web + mobile |
| Solo UI | Zustand | Carrito web, filtros |
| Sesión | Cookies (web) / SecureStore (mobile) | Auth |

---

## 4. API (`apps/api`) — patrones NestJS

### 4.1 Estructura canónica de un feature

```text
feature/
├── feature.module.ts      # imports providers, exports lo necesario
├── feature.controller.ts  # @Controller('recurso'), DTOs, @Roles
├── feature.service.ts       # PrismaService directo (sin repository layer)
├── dto/
└── *.spec.ts
```

**Registro:** todo módulo de negocio importado en `app.module.ts`. Submódulos (p. ej. `SriQueueModule`) solo vía padre (`InvoicesModule`, `PaymentsModule`).

**Guards globales (orden):** `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`  
**Auditoría:** `AuditInterceptor` global; mutaciones admin deberían quedar cubiertas (hay gaps en invoices/returns/marketing).

### 4.2 Abstracciones por interfaz (fases 5–11)

| Interfaz / token | Implementación default | Fase |
|------------------|------------------------|------|
| `PaymentProvider` | Stripe + Kushki/PayPhone/… | 5 |
| `InvoiceProvider` | `DirectSriInvoiceProvider` | 7 |
| `EmailProvider` | Resend / Console | 9 |
| `PushNotificationProvider` | Expo / OneSignal | 9 |
| `LlmProvider` / `EmbeddingProvider` | OpenAI / Anthropic | 10 |
| `ConversationOrchestrator` | Dify / native bot | 10 |
| `EventBus` | Redis Streams / in-process | 11 |
| `AnalyticsEventStore` | Prisma `AnalyticsEventRecord` | 11 |
| `ProductAnalyticsProvider` | PostHog (server-side capture) | 11 |

### 4.3 Fase 7 — SRI (referencia de integración correcta)

```text
Order paid (webhook) → PaymentsModule → SriQueueService.enqueue
  → SriQueueWorker → XML builder → SriSigner (.p12) → SOAP
  → SriDocumentStorage (S3) → Email/WhatsApp delivery
  → Admin: GET /invoices, retry, credit-notes
```

**Checklist fase 7 en API:**

- [x] `InvoicesModule` en `AppModule`
- [x] `SriQueueModule` + BullMQ + Redis
- [x] `InvoiceProviderFactory` → direct SRI
- [x] Encolado desde pagos confirmados
- [x] `@Audit` en emisión/reintento factura y nota de crédito
- [ ] `ScheduleModule.forRoot()` una sola vez en raíz (hoy anidado en SRI)
- [ ] Evitar doble import de `SriQueueModule` (Invoices + Payments)

### 4.4 Fases 8–11 en API — estado

| Módulo | `AppModule` | Notas post-merge |
|--------|:-----------:|------------------|
| `FinanceModule` | ✅ | incomes, expenses, reports, store-credits |
| `NotificationsModule` | ✅ | email, push, marketing distribute |
| `AiModule` | ✅ | FAQ, CMS, chat, search híbrido, drafts producto |
| `AnalyticsModule` | ✅ | **Obligatorio** — sin él `ErrorTracker` en `main.ts` falla al arrancar |

**Lección merge Phase 11:** el código de analytics existía en rama pero **`AnalyticsModule` no estaba en `imports` de `AppModule`** → API no levantaba. Siempre verificar `app.module.ts` tras merge de un módulo nuevo.

**Migración obligatoria Phase 11:**

```bash
pnpm --filter @repo/api prisma migrate deploy
# → 20260705000000_phase11_analytics_events
# → 20260706000000_phase12_shipping_tax_fulfillment
# → 20260707000000_phase12_deferred_backorder_wms
```

**Vars obligatorias Phase 12** (defaults en `env.validation.ts`; documentadas en `apps/api/.env.example`):

`SHIPPING_FREE_THRESHOLD`, `SHIPPING_FLAT_RATE`, `CARRIER_RATE_PROVIDER`, `TAX_PROVIDER`, `FULFILLMENT_PROVIDER`, `ALLOW_BACKORDERS`

### 4.5 Desviaciones API (prioridad)

| Prioridad | Desviación | Estado |
|-----------|------------|--------|
| ~~Alta~~ | ~~`cart.controller.ts` sin `@Public()`~~ | ✅ `@Public()` |
| Media | `FINANCE_ROLES` duplicado en 5 controllers | Pendiente — `finance/finance.constants.ts` |
| ~~Media~~ | ~~Swagger sin tags Finance/Invoices/Analytics~~ | ✅ tags en `main.ts` |
| ~~Media~~ | ~~`EventBusModule` solo vía import indirecto~~ | ✅ en `AppModule` |
| Baja | Mezcla Zod + class-validator | Documentado por bounded context |

---

## 5. Web (`apps/web`) — patrones UI y datos

### 5.1 Arquitectura de rutas

```text
app/layout.tsx
  Providers (Query → Auth → Analytics)
  StoreChrome (oculta Navbar/Footer en /admin)
    ├── /store, /account, /orders …  → tienda
    └── /admin/*
          admin/layout.tsx → AdminSidebar + AdminTopBar
```

### 5.2 Patrón de datos canónico (SSR)

**La mayoría de páginas admin y de cuenta siguen esto:**

```tsx
// page.tsx — Server Component
const api = await getServerApiClient();
const data = await api.recurso.findAll().catch(() => []);
return <VistaCliente initialData={data} />;
```

```tsx
// vista-cliente.tsx — 'use client'
const query = useQuery({
  queryKey: queryKeys.recurso,
  queryFn: () => api.client.recurso.findAll(),
  initialData,
  enabled: useAuthAuthReady(),
});
```

**Referencias buenas:** `admin/support/page.tsx`, `admin/invoices/page.tsx`, `admin/finance/expenses/page.tsx`, `account/notifications/page.tsx`, `admin/knowledge/faqs/page.tsx`.

### 5.3 Diseño neo-brutalist (canónico)

| Elemento | Uso |
|----------|-----|
| Tokens | `neo-gold`, `neo-onyx`, `neo-lace`, `neo-scarlet` en `globals.css` (`@theme`, no solo inline) |
| Cards | `.brutalist-card`, bordes 3px, sombra dura |
| Admin headers | `AdminPageHeader` (eyebrow, métricas, acciones) |
| Animación | `AnimatedPageShell` en store/content; **no** en `/` ni `/admin/*` (ver `template.tsx`) |
| Imágenes | `ProductImage` + helpers `@repo/shared-utils` |
| Idioma | Español en toda UI visible |

**Ver:** [`MERGE-GUIDE-FRONTEND.md`](./MERGE-GUIDE-FRONTEND.md) §1–4.

### 5.4 Admin navigation (canónico)

1. Añadir ruta en `lib/admin-nav.ts` (label, href, `roles`, `group`)
2. Añadir icono en `admin-sidebar.tsx` → `navIcons`
3. Menú móvil admin hereda de `filterAdminNav(role)` en `AdminTopBar`

**Lección merge Phase 11:** se añadió `/admin/analytics` en `admin-nav.ts` y `BarChart3` en sidebar; sin eso la página existía pero **no era navegable por UI**.

### 5.5 Providers (composición canónica)

```tsx
QueryClientProvider → AuthProvider → AnalyticsProvider → children
```

`AnalyticsProvider` debe usar `useAuth()` de `@/contexts/auth-context`, **no** Clerk.

### 5.6 Excepciones intencionales (no alinear)

| Pantalla | Motivo |
|----------|--------|
| `cart`, `wishlist` | Zustand/localStorage — Client Components sin SSR |
| `checkout` | Stripe Elements — estado cliente |
| `admin/orders` kanban | Sin `AnimatedPageShell` duplicado (animación propia) |
| Formularios `admin/*/new` algunos | Client-only legacy — candidatos a refactor SSR |

### 5.7 Desviaciones Web (prioridad)

| Prioridad | Archivo / tema | Estado |
|-----------|----------------|--------|
| ~~Crítica~~ | ~~`@clerk/nextjs` huérfano~~ | ✅ eliminado |
| ~~Crítica~~ | ~~middleware vs admin-nav SUPPORT/knowledge~~ | ✅ `canAccessAdminPath()` |
| ~~Alta~~ | ~~`admin/analytics` sin hooks neo~~ | ✅ `analytics-view.tsx` + selector 7/30/90 días |
| ~~Alta~~ | ~~`admin/*/new` `'use client'` en page~~ | ✅ SC + `*-view.tsx` |
| ~~Media~~ | ~~Vistas finance `useQuery` manual~~ | ✅ `useFinance*` / `useSuppliers` |
| Media | `admin/marketing`, knowledge views | Sin `AnimatedPageShell` (cosmético) |
| Media | `store/page.tsx` | `StoreAnalyticsTracker` + `useSearchParams` sin `<Suspense>` |
| Baja | React Doctor ~96 warnings | forwardRef shadcn, LazyMotion (no bloquean) |

### 5.8 Integración fases 8–11 en Web

#### Fase 8 — Finanzas (~95 % alineado)

| ✅ Hecho | ⚠️ Gap menor |
|---------|--------|
| `/admin/finance/*` con `finance/layout.tsx` + JWT | Sin UI ajuste store-credit (solo lectura en reportes) |
| SSR + `initialData` + hooks `useFinance*` | — |
| `FinanceSubNav`, roles FINANCE | — |

#### Fase 9 — Notificaciones (~75 %)

| ✅ Hecho | ⚠️ Gap |
|---------|--------|
| `/account/notifications` SSR + form | Sin panel admin de campañas (solo `/admin/marketing` promo) |
| `WebPushOptIn`, navbar Bell | Sin vista admin de dispositivos push |

#### Fase 10 — AI / Knowledge (~90 %)

| ✅ Hecho | ⚠️ Gap |
|---------|--------|
| `/admin/knowledge` FAQ + CMS SSR | Sin admin tuning embeddings/bot |
| Nav SUPPORT → knowledge | ✅ middleware alineado |
| `StoreChatWidget` en store layout | Chat anónimo (OK MVP) |

#### Fase 11 — Analytics (~90 %)

| ✅ Hecho | ⚠️ Gap |
|---------|--------|
| `AnalyticsProvider` + cookie banner | Sin gráficos / export (MVP métricas + tabla cohortes) |
| Dashboard admin con `useAnalytics*` | Selector 7/30/90 días + polling 30s |
| Nav + sidebar Analítica | — |

**Fixes aplicados en merge/cierre (deben repetirse como checklist):**

1. `AnalyticsModule` en `AppModule`
2. `AnalyticsProvider` → auth nativo (no Clerk)
3. `providers.tsx` envuelve con `AnalyticsProvider`
4. `admin-nav.ts` + `admin-sidebar.tsx` → enlace Analítica
5. Trackers en store, PDP, cart, checkout
6. Mobile: `trackMobileEvent` en store/product/checkout
7. `api-client`: `useAnalyticsOverview/Funnel/Cohorts`
8. E2E: `presetCookieConsent` en fixtures (banner bloqueaba clics)

---

## 6. Mobile (`apps/mobile`) — patrones Expo

### 6.1 Estructura canónica

```text
app/_layout.tsx     → AuthProvider → QueryClient → Stripe → Cart
app/(tabs)/_layout.tsx → prefetch products + categories
Pantallas           → NeoScreen (+ NeoStaggeredItem en listas)
API                 → api.hooks.use*() / api.client.*
```

### 6.2 Paridad con Web (qué debe coincidir)

| Concern | Web | Mobile | ¿Alineado? |
|---------|-----|--------|:----------:|
| Auth JWT | cookies | SecureStore | ✅ |
| Catálogo + búsqueda | Meilisearch + SSR | `useProductSearch` | ✅ |
| Checkout Stripe | Payment Element | Payment Sheet | ✅ |
| Devoluciones | `/orders/[id]/return` | `order/[id]/return` | ✅ |
| Notificaciones prefs | SSR form | `NotificationPreferencesPanel` | ✅ |
| Push tokens | Web Push API | Expo notifications | ✅ |
| Chat soporte | `StoreChatWidget` | `StoreChatWidget` | ✅ |
| Analytics eventos | `trackEvent` + consent | `trackMobileEvent` + consent banner | ✅ |
| Wishlist | ✅ | ❌ | gap intencional MVP |
| Help / FAQ | `/help` | `/help` | ✅ |
| CMS legal | `/legal/[slug]` | ❌ | gap — solo web |

### 6.3 Desviaciones Mobile (prioridad)

| Prioridad | Tema | Estado |
|-----------|------|--------|
| ~~Media~~ | ~~Env API duplicado~~ | ✅ `lib/env.ts` |
| ~~Media~~ | ~~Copy Clerk~~ | ✅ eliminado |
| ~~Media~~ | ~~`remove_from_cart` no trackeado~~ | ✅ en `cart.tsx` |
| ~~Media~~ | ~~Deep link `order/:id`~~ | ✅ → `/order/[id]` |
| ~~Baja~~ | ~~Sin `.env.example`~~ | ✅ |
| ~~Baja~~ | ~~Analytics sin consent~~ | ✅ banner + SecureStore |
| Baja | CMS legal `/legal/[slug]` | Solo web por ahora |
| Baja | Wishlist | No en roadmap MVP mobile |

### 6.4 Fases 7–11 en Mobile (resumen)

- **Fase 7:** cliente ve recibo PDF (`getReceipt`); sin RIDE/XML SRI en UI
- **Fase 8:** solo lectura store credit en cuenta
- **Fase 9:** prefs + push automático; sin admin
- **Fase 10:** chat en tienda; sin `/help`
- **Fase 11:** POST eventos con consent; sin PostHog/Clarity en cliente (igual que web server-side)

---

## 7. `packages/api-client` — contrato front↔API

### 7.1 Patrón canónico

1. Añadir métodos en `client.ts` bajo el namespace correcto (`finance`, `analytics`, …)
2. Tipar con interfaces de `@repo/shared-types` (evitar `any`)
3. Añadir `queryKeys.*` en `hooks.ts`
4. Exponer `useX` con `useQuery` / `useMutation`
5. Web admin con datos frescos: **SSR `initialData` + mismo `queryKey`**

### 7.2 Desviaciones

| Tema | Estado |
|------|--------|
| Hooks finance completos | ✅ usados en vistas admin |
| Hooks analytics Phase 11 | ✅ dashboard admin los consume |
| `vitest` sin tests | `passWithNoTests` en script (fix merge) |
| Generación OpenAPI automática | Parcial — mucho client manual |

---

## 8. Lecciones de merge (obligatorio leer antes de integrar)

### 8.1 Checklist técnico post-merge (cualquier fase)

```bash
# 1. Módulo API registrado
grep "NuevoModule" apps/api/src/app.module.ts

# 2. Migraciones
pnpm --filter @repo/api prisma migrate deploy

# 2b. Vars Phase 12 (shipping/taxes/fulfillment) — ver apps/api/.env.example

# 3. JWT alineado
# apps/api/.env y apps/web/.env.local → mismo AUTH_JWT_ACCESS_SECRET

# 4. Typecheck + tests
pnpm typecheck
pnpm --filter @repo/api test
pnpm --filter @repo/web test
pnpm --filter @repo/mobile typecheck

# 5. API arranca
curl http://localhost:3001/v1/health

# 6. E2E (API + web dev + docker postgres/redis)
pnpm --filter @repo/api test:e2e
pnpm --filter @repo/web test:e2e
```

### 8.2 Checklist UI (ver [`MERGE-GUIDE-FRONTEND.md`](./MERGE-GUIDE-FRONTEND.md))

- [ ] Sin `loading.tsx` ni skeletons de página
- [ ] Admin: `AdminPageHeader`, nav en `admin-nav.ts` + iconos sidebar
- [ ] Auth nativo en providers y layouts (no Clerk)
- [ ] `getServerApiClient` en páginas con datos
- [ ] `initialData` en vistas cliente con React Query
- [ ] Copy español; tokens neo (no `border-black` suelto)
- [ ] Playwright: `presetCookieConsent` si hay banner analytics

### 8.3 Errores reales en merges recientes

| Error | Síntoma | Fix |
|-------|---------|-----|
| Módulo no en `AppModule` | API crash `ErrorTracker` / 404 rutas | Importar módulo |
| JWT distinto API/web | Navbar logueado + página sign-in en admin | Igualar secret |
| Migración no aplicada | 500 `AnalyticsEventRecord does not exist` | `prisma migrate deploy` |
| UI sin nav | URL directa OK, sidebar sin enlace | `admin-nav.ts` + sidebar |
| Clerk en provider nuevo | Web 500 | `useAuth` nativo |
| Cookie banner en E2E | Timeouts en clics | `presetCookieConsent` |
| `AnalyticsProvider` fuera de `providers.tsx` | Tracking no corre | Envolver árbol |

### 8.4 SDD y documentación de fase

Para fases marcadas SDD en `TODO.md`:

1. Spec / proposal en OpenSpec o Engram  
2. Implementación API → `api-client` → web → mobile (en ese orden de contrato)  
3. Verify + archive  
4. Actualizar este doc + `MERGE-GUIDE` si cambia el patrón canónico  

Fases 8–10 cerraron con PRs encadenadas + UI closure; fase 11 con PR #5 + fixes en `963c41c` (E2E/auth).

---

## 9. Matriz “así lo hace la mayoría → tú también deberías”

| Tema | Mayoría hace | Deberías hacer | Excepciones documentadas |
|------|--------------|----------------|--------------------------|
| Auth | JWT nativo + roles en Prisma | Igual en web/mobile | — |
| API módulo nuevo | Registro en `AppModule` | Siempre verificar tras merge | Submódulos solo vía padre |
| DTOs | class-validator en `dto/` | Igual | Webhooks: Zod puntual |
| Web datos admin | SC fetch + `initialData` | Igual | cart/wishlist Zustand |
| Web admin UI | `AdminPageHeader` + neo tokens | Igual | Kanban pedidos |
| Web animación | `AnimatedPageShell` fuera admin | Igual | `/`, kanban |
| Mobile shell | `NeoScreen` | Igual | `entrance={false}` en index/store |
| Mobile datos | `api.hooks` + prefetch tabs | Igual | — |
| Cliente API | `api-client` hooks tipados | Igual; no `fetch` crudo salvo auth mobile legacy | AuthProvider mobile |
| Fase con cola | BullMQ + Redis + worker | Mismo patrón SRI / knowledge index | — |
| Eventos dominio | `EventBus.publish` → consumers | Analytics escucha `order.paid` | — |
| Tracking | `trackEvent` / `trackMobileEvent` → POST `/analytics/events` | Mismos nombres de evento en shared-types | Mobile sin consent aún |
| Tests E2E web | `authenticatePage` + API en :3001 | Docker + API up | — |

---

## 10. Roadmap de alineación (sugerido)

### Sprint A — Deuda merge / consistencia (bajo riesgo)

1. ~~Quitar `@clerk/nextjs` de web~~ ✅
2. ~~Alinear `middleware.ts` con `admin-nav.ts` (SUPPORT + knowledge)~~ ✅ `canAccessAdminPath()`
3. ~~Unificar `AUTH_JWT` en `.env.example` (api + web + documentar mobile)~~ ✅ + `apps/mobile/.env.example`
4. ~~Copy Clerk en mobile~~ ✅
5. ~~`admin/analytics`: tipos estrictos + `AnimatedPageShell` + neo tokens~~ ✅ `analytics-view.tsx` + hooks

### Sprint B — Paridad hooks y SSR ✅

1. ~~Finance views → `useFinance*` hooks~~ ✅
2. ~~Refactor `admin/*/new` a patrón SC + vista cliente~~ ✅
3. ~~Analytics dashboard → hooks + selector de rango~~ ✅

### Sprint C — Paridad mobile ✅

1. ~~`/help` screen~~ ✅
2. ~~`remove_from_cart` tracking~~ ✅
3. ~~Fix deep link pedidos~~ ✅
4. ~~`NeoScreen` en stack screens~~ ✅ `account/notifications` + `help`
5. ~~`.env.example` mobile~~ ✅ + `lib/env.ts` unificado
6. ~~Consent analytics mobile~~ ✅ banner + `analytics-consent.ts`

### Sprint D — API hardening ✅

1. ~~`@Audit` en invoices/returns/marketing~~ ✅
2. ~~`cart` `@Public()`~~ ✅
3. ~~`EventBusModule` explícito en `AppModule`~~ ✅
4. ~~Swagger tags fases 7–11~~ ✅

### Sprint E — Fase 12 (shipping / taxes / fulfillment) ✅

1. ~~`ShippingModule`, `TaxModule`, `FulfillmentModule` en `AppModule`~~ ✅
2. ~~Migraciones `20260706` + `20260707`~~ ✅
3. ~~Vars Phase 12 en `env.validation.ts` + `.env.example`~~ ✅
4. ~~`@Audit` en mutaciones fulfillment/WMS~~ ✅
5. ~~Checkout: cotización envío + IVA Ecuador vía `TaxService`~~ ✅
6. ~~Admin: `ShipmentPanel` en detalle de pedido~~ ✅
7. ~~Cliente: `/store/orders/[id]/tracking`~~ ✅

**Gaps no bloqueantes (fase 12):**

| Gap | Estado | Nota |
|-----|--------|------|
| Lista global de fulfillments en admin | Parcial | Panel por pedido en `/admin/orders/[id]`; sin ruta `/admin/fulfillments` |
| Vista admin backorders | API only | `GET /fulfillment/backorders`; sin UI web |
| Carrier APIs reales (Shippo/EasyPost) | Stub + zones | `CARRIER_RATE_PROVIDER=zones` por defecto en dev |
| Mobile tracking envíos | Pendiente | Phase 12 web/API; paridad móvil en fase futura |
| `shipment-panel` con `useReducer` | Cosmético | React Doctor; formulario pequeño con `useState` |
| Tracking cliente SSR | ✅ | `page.tsx` + `order-tracking-view.tsx` con `getServerApiClient` |

### Sprint F — Fase 13 (search / catalog / performance) ✅

1. ~~`CatalogModule` + Meilisearch facets en `AiModule`~~ ✅
2. ~~`GET /catalog` público con Redis cache (`CATALOG_CACHE_TTL_SECONDS`)~~ ✅
3. ~~Web store: SSR `api.catalog.browse` + `StoreFilters` neo + facets~~ ✅
4. ~~Mobile: `useCatalog` + prefetch tabs, sin `ActivityIndicator`~~ ✅
5. ~~`next.config.ts`: AVIF/WebP + bundle analyzer (no `.mjs` duplicado)~~ ✅
6. ~~`POST /search/admin/reindex` con `@Audit`~~ ✅

**Gaps no bloqueantes (fase 13):**

| Gap | Estado | Nota |
|-----|--------|------|
| Core Web Vitals / Lighthouse CI | Pendiente | Optimización imágenes configurada; sin pipeline CI |
| Sinónimos Meilisearch | API | Config en `meilisearch.service`; revisar en producción |

### Sprint G — Fase 14 (reviews / referrals / loyalty) ✅

1. ~~Prisma: `ProductReview`, `ReferralCode`, `ReferralConversion`, `LoyaltyAccount`, `LoyaltyTransaction`; campos pre-order en `Product`~~ ✅
2. ~~API: `ReviewsModule`, `ReferralsModule` (`ReferralEngine`), `LoyaltyModule` (`LoyaltyEngine`), `OrderPaidEngagementConsumer`~~ ✅
3. ~~Checkout: `referralCode` + `loyaltyPointsToRedeem` en `CreateOrderDto` / `OrdersService`~~ ✅
4. ~~Web PDP: SSR + JSON-LD `aggregateRating`, `ProductReviews`, neo UI (`MERGE-GUIDE`)~~ ✅
5. ~~Web admin: `/admin/reviews`, `/admin/referrals`; checkout `EngagementInputs` con `useReducer`~~ ✅
6. ~~Mobile: reseñas en PDP, filtro `minRating` en tienda, referidos/puntos en checkout y cuenta~~ ✅
7. ~~`@repo/api-client`: hooks `useProductReviews`, `useLoyaltyAccount`, `useReferralCode`, etc.~~ ✅
8. ~~Catálogo: facet `minRating` + `averageRating`/`reviewCount` en índice Meilisearch~~ ✅

**Gaps no bloqueantes (fase 14):**

| Gap | Estado | Nota |
|-----|--------|------|
| Google/Trustpilot API live | Stub | `ExternalReviewsService` devuelve perfil configurable; integración real opcional |
| Admin loyalty dashboard | Pendiente | Lealtad visible en cuenta cliente; sin panel admin dedicado |
| Admin reviews SSR | ✅ | `page.tsx` + `reviews-moderation-view.tsx` con `AdminPageHeader` + `initialData` |
| Pre-order reserva dedicada | Parcial | Flags en producto + PDP; sin cola de fulfillment pre-order |

---

## 11. Referencias rápidas de archivos

```text
# Auth
apps/api/src/auth/
apps/web/src/contexts/auth-context.tsx
apps/web/src/middleware.ts
apps/web/src/lib/session.ts
apps/mobile/src/providers/AuthProvider.tsx

# API raíz
apps/api/src/app.module.ts
apps/api/src/main.ts

# Web datos
apps/web/src/lib/api.ts
apps/web/src/lib/client-api.ts

# Admin
apps/web/src/lib/admin-nav.ts
apps/web/src/components/layout/admin-sidebar.tsx
apps/web/src/components/admin/admin-page-header.tsx

# Mobile
apps/mobile/src/lib/api.ts
apps/mobile/src/app/(tabs)/_layout.tsx

# Shared client
packages/api-client/src/client.ts
packages/api-client/src/hooks.ts

# Guías
docs/MERGE-GUIDE-FRONTEND.md
docs/PROGRAMMING-LOGIC-AUDIT.md  (este archivo)
```

---

## 12. Conclusión

El monorepo tiene un **núcleo coherente y alineado** tras Sprints A–G (jun 2026):

- API modular NestJS con guards JWT/RBAC, `@Audit` en mutaciones críticas (incl. fulfillment), abstracciones por proveedor y Swagger documentado  
- Web con SSR, shell admin unificado, hooks `api-client` en finance/analytics, checkout con IVA + envío, diseño neo-brutalist  
- Mobile con paridad comercial completa (help, wishlist, legal CMS, tracking con consent, deep links)  

**Gaps residuales:** ninguno bloqueante. Cosmético opcional: `shipment-panel` sin `useReducer`; lista global de fulfillments/backorders solo API.

| Área | Estado |
|------|--------|
| Analytics admin gráficos | ✅ embudo barras, top productos, heatmap cohortes + CSV |
| React Doctor web | ✅ 100/100 (`useReducer` en formularios críticos) |
| Phase 12 shipping/taxes | ✅ merge `71b686d`; Playwright UI verificado |
| Phase 13 search/catalog | ✅ merge; React Doctor 100; store facetado SSR |
| Phase 14 engagement | ✅ merge PR #6; reviews admin SSR; React/Nest/Expo doctors 100/100/21 |

La **mayor fuente de bugs en merge** sigue siendo **cableado olvidado**: `AppModule`, JWT, migraciones, nav admin, providers, consent en E2E. Usar las checklists de §8 antes de cada merge a `main`.

---

*Mantenido junto a [`MERGE-GUIDE-FRONTEND.md`](./MERGE-GUIDE-FRONTEND.md). Actualizar este documento cuando un patrón canónico cambie o una fase nueva cierre.*
