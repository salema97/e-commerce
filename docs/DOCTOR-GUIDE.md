# Guía de doctores — Web, API y Móvil

**Complementa:** [`PROGRAMMING-LOGIC-AUDIT.md`](./PROGRAMMING-LOGIC-AUDIT.md), [`MERGE-GUIDE-FRONTEND.md`](./MERGE-GUIDE-FRONTEND.md)

Este documento define **cómo ejecutar los doctores**, qué patrones evitan sus hallazgos, y qué corregir **antes de mergear** código nuevo.

---

## 1. Comandos (desde la raíz del monorepo)

| App | Herramienta | Comando |
|-----|-------------|---------|
| Web | [React Doctor](https://react.doctor) | `pnpm health:web` |
| API | [NestJS Doctor](https://nestjs.doctor) | `pnpm health:api` |
| Mobile | [Expo Doctor](https://docs.expo.dev/develop/tools/#expo-doctor) | `pnpm health:mobile` |
| Las tres | — | `pnpm health` |

> **Nota:** no uses `pnpm doctor` en las apps — es el doctor de **pnpm**, no del stack. Los scripts se llaman `health:*`.

### Baseline tras auditoría (jun 2026)

| App | Score / estado | Errores críticos |
|-----|----------------|------------------|
| Web | **100/100** (antes 90 → 78 → 63) | **0** | 0 warnings |
| API | **83/100** | **0** (antes 6) |
| Mobile | **21/21 checks** expo-doctor | **0** — `expo-doctor` como devDependency en `@repo/mobile` |

---

## 2. Web — React Doctor

### 2.1 Patrones obligatorios (evitan errores)

#### Server Actions con auth

Toda Server Action que muta datos o redirige a admin **debe** verificar sesión:

```ts
// apps/web/src/lib/server-action-auth.ts
import { requireServerRoles, requireServerAuthToken } from '@/lib/server-action-auth';

export async function retryInvoice(id: string) {
  await requireServerRoles(financeRoles, '/sign-in?redirect_url=/admin/invoices');
  const token = await requireServerAuthToken();
  // fetch con Authorization...
}
```

**Nunca** exportar `redirect()` sin comprobar rol (ej. `redirectToInvoiceDetail`).

#### SSR: `notFound()` / `redirect()` fuera de `try/catch`

```ts
// ✅ Correcto
const product = await api.products.findOne(id).catch(() => null);
if (!product) notFound();

// ❌ Incorrecto — Next.js lanza errores de control de flujo que catch traga
try {
  const product = await api.products.findOne(id);
} catch {
  notFound();
}
```

#### Awaits independientes en Server Components

```ts
const [session, { id }, api] = await Promise.all([
  getSession(),
  params,
  getServerApiClient(),
]);
```

#### TanStack Query: destructurar resultado

```tsx
// ✅ Solo suscribe a campos usados
const { data: invoices = [], isLoading } = useQuery({ ... });

// ❌ Suscribe a todo el objeto query
const invoicesQuery = useQuery({ ... });
```

#### `useSearchParams` dentro de `<Suspense>`

```tsx
<Suspense fallback={null}>
  <StoreAnalyticsTracker />
</Suspense>
```

#### Service worker (`public/sw.js`)

Usar **JavaScript puro** o JSDoc — no sintaxis TypeScript (`as Type`):

```js
const fetchEvent = /** @type {FetchEvent} */ (event);
self.skipWaiting();
```

#### Secretos en E2E

`playwright.config.ts` debe **fallar** si falta `AUTH_JWT_ACCESS_SECRET` (cargar desde `apps/api/.env`):

```ts
if (!process.env.AUTH_JWT_ACCESS_SECRET) {
  throw new Error('AUTH_JWT_ACCESS_SECRET is required for Playwright E2E');
}
```

#### Dependencias huérfanas

Si migraste de Clerk a JWT nativo, elimina `@clerk/nextjs` de `package.json` cuando no haya imports.

#### Estado derivado de props (imágenes)

```tsx
// ✅ Sin useEffect para resetear error al cambiar URL
const [failedUrl, setFailedUrl] = useState<string | null>(null);
const loadError = failedUrl !== null && failedUrl === normalizedUrl;
onError={() => setFailedUrl(normalizedUrl ?? null)}
```

#### Context provider estable

```tsx
const value = useMemo(
  () => ({ user, accessToken, loading, setSession, refresh, signOut }),
  [user, accessToken, loading, setSession, refresh, signOut],
);
```

#### Consent banner (SSR + cliente)

Usar `useSyncExternalStore` para leer `localStorage` sin flash:

```tsx
const needsConsent = useSyncExternalStore(
  () => () => {},
  () => getStoredConsent() === null,
  () => false,
);
```

### 2.2 Backlog conocido (warnings, no errores)

| Regla | Cantidad aprox. | Acción planificada |
|-------|-----------------|-------------------|
| `no-react19-deprecated-apis` (forwardRef) | ~42 en shadcn/ui | Migración masiva shadcn → React 19 |
| `use-lazy-motion` | ~8 | LazyMotion + `m` en animaciones |
| `no-prevent-default` en forms admin | ~7 | Server Actions en formularios finance/knowledge |
| `prefer-useReducer` | ~5 | Refactor paneles complejos (refund, checkout) |
| `label-has-associated-control` | shadcn Label | Pasar `htmlFor` desde consumidor |

**No silenciar** estas reglas en config salvo falso positivo documentado.

---

## 3. API — NestJS Doctor

### 3.1 Patrones obligatorios

#### Controllers delgados, lógica en services

```ts
// ✅ Controller
@Post()
create(@Body() dto: CreateTestInvoiceDto) {
  return this.testInvoicesService.create(dto);
}

// ❌ Controller con if/Prisma directo
```

Aplicado en: `TestInvoicesController`, `TestPaymentsController`, `ReturnsController.getReturn`, `WebhookController`.

#### Webhooks: validación en service

```ts
// WebhookController — una línea
await this.webhookService.receiveEvolutionWebhook(event, request.rawBody, signature);
```

#### Seed sin secretos hardcodeados

```ts
// prisma/seed/auth.ts — obligatorio en .env
SEED_USER_PASSWORD=SeedDemo123!
```

Si falta `SEED_USER_PASSWORD`, `prisma seed` debe **fallar**, no usar default en código.

#### Guards globales (config documentada)

El proyecto usa `APP_GUARD` con `JwtAuthGuard` + `RolesGuard`. NestJS Doctor avisa `@UseGuards` faltante en cada endpoint — es **falso positivo**.

Config en `apps/api/nestjs-doctor.config.json`:

```json
{
  "rules": {
    "missing-use-guards": "off",
    "service-injects-orm": "off"
  }
}
```

**Por qué no es “ocultar”:** seguimos el [recipe oficial NestJS + Prisma](https://docs.nestjs.com/recipes/prisma) y guards globales en `app.module.ts`. La regla no detecta `APP_GUARD`.

#### Constructores `readonly`

```ts
constructor(private readonly prisma: PrismaService) {}
```

#### Fire-and-forget explícito

```ts
void this.stripeCustomerService.createOrUpdateCustomer(...).catch(() => undefined);
```

#### Test helpers solo en no-producción

- **Controllers** `test/*`: registrados solo si `isNonProduction()`
- **Services** `TestInvoicesService`, `TestPaymentsService`: siempre en `providers` (NestJS Doctor requiere registro estático)

### 3.2 Backlog API (info/warnings)

| Tema | Acción futura |
|------|----------------|
| `@Type()` en DTOs con enums | Añadir en `analytics.dto.ts`, `create-product.dto.ts`, etc. |
| `onDelete` en Prisma relations | Migración schema con `onDelete: Cascade/SetNull` |
| Imports cruzados `../payments/dto/` | Barrel exports en `payments/index.ts` |
| `async` sin `await` en stubs console | Quitar `async` en providers de desarrollo |
| Exports no usados en modules | Limpiar `exports` de factories |

---

## 4. Mobile — Expo Doctor

### 4.1 Patrones obligatorios

#### `app.json` — splash vía plugin (SDK 56+)

```json
"plugins": [
  ["expo-splash-screen", { "backgroundColor": "#ffffff" }],
  ["@stripe/stripe-react-native", {
    "merchantIdentifier": "merchant.com.example.ecommerce",
    "enableGooglePay": false
  }],
  "@sentry/react-native"
]
```

**No** usar clave raíz `"splash"` — expo-doctor la rechaza.

#### Metro monorepo

```js
// metro.config.js
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [projectNodeModules, workspaceNodeModules];
config.resolver.disableHierarchicalLookup = false; // requerido por expo-doctor
```

#### Versiones SDK

Tras cambiar dependencias nativas:

```bash
cd apps/mobile
npx expo install expo-splash-screen
npx expo install --check   # revisar antes de --fix
```

**Monorepo:** mobile usa `react: "catalog:"` (misma versión que web, p. ej. `19.2.7`). Expo puede advertir en `expo install --check`; excluir en `apps/mobile/package.json`:

```json
"expo": {
  "install": {
    "exclude": ["react", "typescript"]
  }
}
```

**`expo-doctor` en PATH:** declarar `expo-doctor` en `devDependencies` de `apps/mobile` y ejecutar vía `pnpm health:mobile` (script `health:expo` → `expo-doctor`). No depender de instalación global.

#### Deduplicar dependencias nativas (expo-doctor check #21)

Si expo-doctor reporta duplicados de `react` o `react-native`:

1. **React:** usar `"react": "catalog:"` en `apps/mobile` (no fijar `19.2.3` aparte del catalog).
2. **`@repo/shared-ui`:** `react-native` solo como **peer** con `peerDependenciesMeta.optional: true` — no en `devDependencies`.
3. **Typecheck shared-ui:** alias en `packages/shared-ui/tsconfig.json`:

```json
"paths": {
  "react-native": ["../../apps/mobile/node_modules/react-native"]
}
```

4. Tras quitar `devDependencies.react-native` de shared-ui, borrar `packages/shared-ui/node_modules` y `pnpm install`.

#### Alinear `@types/react` en todo el monorepo

Usar catalog en `pnpm-workspace.yaml`:

```yaml
'@types/react': ^19.2.17
'@types/react-dom': ^19.2.3
```

Evita TS2742 en web cuando mobile instala tipos distintos.

### 4.2 Checklist pre-merge mobile

- [ ] `npx expo-doctor` sin fallos de schema/config
- [ ] Plugins nativos (Stripe, Sentry) con opciones completas
- [ ] `pnpm --filter @repo/mobile typecheck`
- [ ] No mezclar `typescript@6` solo en mobile si el monorepo usa `5.9.3` (AGENTS.md)

---

## 5. Checklist unificado pre-merge

Ejecutar en orden:

```bash
pnpm install
pnpm --filter @repo/api prisma generate   # si hubo cambios schema
pnpm typecheck
pnpm health                                # react + nest + expo
pnpm test                                  # unitarios
```

### Por tipo de cambio

| Cambio | Doctor extra |
|--------|--------------|
| Server Action nueva | `health:web` → regla `server-auth-actions` |
| Página admin SSR | `server-sequential-independent-await`, `nextjs-no-redirect-in-try-catch` |
| Vista con React Query | `query-destructure-result` |
| Controller NestJS nuevo | `health:api` → lógica en service, `@Roles` o `@Public` |
| Webhook | Firma + idempotencia en service |
| Dependencia Expo nativa | `npx expo install <pkg>` + `health:mobile` |
| Seed / secretos | Sin literales en código; solo `.env` |

---

## 6. Qué NO hacer (anti-patrones)

| Anti-patrón | Por qué |
|-------------|---------|
| `eslint-disable` / `react-doctor` ignore sin motivo | Oculta bugs reales |
| Fallback `?? 'dev-secret'` en prod o E2E | Fail-open de seguridad |
| `as any` para silenciar doctor | Corregir tipos en `shared-types` / `api-client` |
| `disableHierarchicalLookup: true` en Metro sin necesidad | Falla expo-doctor; usar `nodeModulesPaths` |
| Registrar módulo Nest sin añadir a `providers` | NestJS Doctor error + runtime DI fail |
| Clerk en código nuevo | Auth canónico es JWT nativo |

---

## 7. CI sugerido (futuro)

```yaml
# .github/workflows/health.yml
- run: pnpm health:api -- --min-score 80    # nestjs-doctor
- run: pnpm health:web                       # react-doctor (exit 1 si score < umbral)
- run: pnpm health:mobile
```

React Doctor: `npx react-doctor . --verbose --min-score 60` (subir umbral con el tiempo).

---

## 8. Archivos de referencia creados/actualizados

| Archivo | Rol |
|---------|-----|
| `apps/web/src/lib/server-action-auth.ts` | Auth en Server Actions |
| `apps/api/nestjs-doctor.config.json` | Guards globales + Prisma recipe |
| `apps/api/src/invoices/test-invoices.service.ts` | Lógica test fuera del controller |
| `apps/api/src/payments/test-payments.service.ts` | Idem |
| `apps/api/src/webhooks/webhook.service.ts` | `receiveEvolutionWebhook()` |
| `apps/web/public/sw.js` | PWA sin sintaxis TS |
| `package.json` (raíz) | Scripts `health:*` |

---

## 9. Resumen ejecutivo

1. **Ejecuta `pnpm health`** antes de cada PR que toque web, API o mobile.
2. **Errores = bloqueantes**; warnings = planificar en el mismo epic o issue dedicado.
3. **Correcciones reales** (auth, services, destructuring, env) — no desactivar reglas salvo arquitectura documentada (guards globales, Prisma directo).
4. Tras merge de fase, repetir doctores + [`PROGRAMMING-LOGIC-AUDIT.md`](./PROGRAMMING-LOGIC-AUDIT.md) checklist.

---

*Actualizar este documento cuando cambie el baseline de scores o se añadan reglas nuevas en los doctores.*
