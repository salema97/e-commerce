# Guía de merge — Web, móvil y patrones frontend

Documento de referencia para revisar y mergear PRs sin romper diseño neo-brutalist, SSR, animaciones ni el shell del panel admin.

**Última actualización:** junio 2026  
**Commits de referencia en `main`:**

| Commit     | Tema |
|------------|------|
| `4dc9245`  | Tailwind v4 tokens neo + API `nest start --watch` |
| `5551c1d`  | `ProductImage` unificado web/móvil |
| `de9f863`  | Animaciones neo en todas las pantallas |
| `a2d217b`  | SSR sin `loading.tsx` ni skeletons de página |
| `8b38fcf`  | Shell admin (sidebar, top bar, cabeceras) |

---

## 1. Diseño neo-brutalist (web)

### Tokens Tailwind v4

- Los **colores** van en `@theme` (no solo en `@theme inline`), o utilidades como `bg-neo-gold` quedan transparentes.
- Las **fuentes** van en `@theme inline` (`--font-sans`, `--font-display`).
- Estilos custom en `@layer components` / `@layer base`.

**Archivo clave:** `apps/web/src/app/globals.css`

| Token / clase        | Uso |
|----------------------|-----|
| `neo-gold`           | Acento, CTAs, headers activos |
| `neo-onyx`           | Bordes, texto, fondos oscuros |
| `neo-lace`           | Fondo crema de la app |
| `neo-scarlet`        | Destructivo / urgente |
| `neo-green`          | Estados positivos (kanban entregados) |
| `.brutalist-card`    | Tarjetas con borde 3px + sombra dura |
| `.neo-page-title`    | Títulos secundarios (formularios, detalle) |
| `.neo-panel`         | Contenedores con sombra 8px (soporte, etc.) |
| `.kanban-scroll`     | Scroll horizontal del tablero de pedidos |

### Componentes UI

- shadcn/Radix con estilo neo: `Button`, `Table`, `Dialog`, `Sheet`, `FormSelect`, etc.
- Tablas admin: usar `<Table>` directamente, sin wrappers `rounded-md` genéricos.
- **UI en español** en toda la superficie visible al usuario.

### Imágenes de producto

- Usar `ProductImage` (`apps/web/src/components/product/product-image.tsx`).
- Helpers en `@repo/shared-utils`: `getProductPrimaryImage`, `getProductPrimaryImageUrl`, `normalizeProductImageUrl`.
- Fallback: texto **"Sin imagen"** (no mostrar solo el alt del nombre).
- `placehold.co` con `?text=` rompe el optimizador de Next → normalizar a `/png` o usar fallback.

---

## 2. SSR y datos en servidor (web)

### Principio

> Las páginas deben renderizar **con datos en el servidor** (Server Components). **No** usar `loading.tsx`, skeletons ni spinners como estado inicial de página.

### Patrón estándar

```tsx
// page.tsx — Server Component (sin 'use client')
import { getServerApiClient } from '@/lib/api';
import { MiVistaCliente } from './mi-vista-cliente';

export default async function MiPage() {
  const api = await getServerApiClient();
  const data = await api.recurso.findAll().catch(() => []);

  return <MiVistaCliente initialData={data} />;
}
```

```tsx
// mi-vista-cliente.tsx — 'use client' solo si hay interactividad
'use client';

export function MiVistaCliente({ initialData }: { initialData: Tipo[] }) {
  const query = useQuery({
    queryKey: ['recurso'],
    queryFn: () => api.recurso.findAll(),
    initialData, // hidrata sin flash de carga
    refetchInterval: 10_000, // polling opcional (soporte, facturas)
  });

  return (/* UI con datos ya presentes */);
}
```

**API servidor:** `apps/web/src/lib/api.ts` → `getServerApiClient()` (lee cookie JWT).

### Qué evitar en PRs

| ❌ No mergear si… | ✅ Hacer en su lugar |
|-------------------|----------------------|
| Nuevo `loading.tsx` en `app/` | Fetch en `page.tsx` + `initialData` |
| `Skeleton` / `animate-pulse` al cargar página | Datos SSR o estado vacío honesto |
| `isLoading && <Spinner />` en listados admin | `initialData` desde servidor |
| `Suspense` con skeleton visible | `fallback={null}` solo si el hijo lo exige (p. ej. `useSearchParams`) |
| `mounted` + skeleton en cart/wishlist | Render directo (estado Zustand local) |

### Excepciones intencionales

| Pantalla | Motivo |
|----------|--------|
| `cart`, `wishlist` | Estado en Zustand/localStorage → **Client Components** sin SSR |
| Botón "Enviando…" / `isPending` en mutaciones | Feedback de acción, no carga de página |
| `checkout` móvil `ActivityIndicator` en `isProcessing` | Solo durante pago, no al abrir pantalla |

### Archivos eliminados / no reintroducir

- `apps/web/src/app/loading.tsx` — **eliminado a propósito**

---

## 3. Shell del panel admin

Rutas bajo `/admin/*` usan un **chrome propio**, no el de la tienda.

### Arquitectura

```
app/layout.tsx
  └── StoreChrome          → oculta Navbar + Footer si pathname.startsWith('/admin')
        └── children

app/admin/layout.tsx
  ├── AdminSidebar         → fixed, h-screen, w-24, solo lg+
  ├── AdminTopBar          → sección actual, usuario, menú móvil
  └── main (children)
```

| Archivo | Rol |
|---------|-----|
| `components/layout/store-chrome.tsx` | Navbar/Footer solo en tienda |
| `components/layout/admin-sidebar.tsx` | Nav iconos + tooltips + link tienda |
| `components/layout/admin-top-bar.tsx` | Header admin + Sheet móvil |
| `components/admin/admin-page-header.tsx` | Cabecera neo unificada (eyebrow, métricas, acciones) |
| `lib/admin-nav.ts` | Config nav compartida (sidebar + menú móvil) |

### Reglas al mergear admin

1. **No** mostrar `Navbar` ni `Footer` de tienda en `/admin/*`.
2. Páginas de listado usan `AdminPageHeader` (no `neo-page-title` suelto ni `text-2xl font-bold`).
3. Nuevos ítems de menú → actualizar `lib/admin-nav.ts` **y** el mapa de iconos en `admin-sidebar.tsx`.
4. `queryKeys.categories` es un **array**, no función: `queryKeys.categories` (sin `()`).
5. Contenedor de página: `className="flex min-h-0 flex-1 flex-col …"` para que soporte/kanban hagan scroll bien.
6. Soporte: panel `min-h-[min(70vh,720px)]` + grid dos columnas en `lg+`.

### Pedidos (kanban)

- `OrdersKanban` tiene su propia animación de entrada; **no** envolver en `AnimatedPageShell` duplicado.
- Usa `AdminPageHeader` internamente (mismo look que dashboard).

---

## 4. Animaciones

### Tokens compartidos

`packages/shared-utils/src/neo-motion.ts` — duraciones, easings, stagger, sombras.

### Web — Motion (`motion/react`)

| Archivo | Uso |
|---------|-----|
| `apps/web/src/lib/neo-motion.ts` | Variantes web (hover sidebar, kanban, etc.) |
| `components/motion/neo-page-transition.tsx` | `NeoPageTransition`, `AnimatedPageShell`, `NeoStagger`, `NeoReveal` |
| `app/template.tsx` | Transición entre rutas |

**Reglas:**

- `NeoPageTransition` **no** anima `/` ni rutas `/admin/*` (evita doble animación con layout admin).
- Páginas store/content: envolver en `AnimatedPageShell` con `header` opcional.
- Respetar `useReducedMotion` en componentes animados.
- Home (`/`) y kanban de pedidos: animaciones locales, sin `AnimatedPageShell` redundante.

### Móvil — Reanimated

| Archivo | Uso |
|---------|-----|
| `apps/mobile/src/components/neo-animated.tsx` | Primitivos animados |
| `apps/mobile/src/components/neo-screen.tsx` | Wrapper `SafeAreaView` + entrada |

**Reglas:**

- Todas las pantallas usan `NeoScreen`.
- `index` y `store`: `entrance={false}` (animación propia del contenido).
- Listas: `NeoStaggeredItem`; auth: `NeoScaleIn`.
- Plugin Reanimated en `babel.config.js`.

### Prefetch móvil (equivalente a SSR)

En `apps/mobile/src/app/(tabs)/_layout.tsx`:

```tsx
queryClient.prefetchQuery({
  queryKey: queryKeys.products(),
  queryFn: () => api.client.products.findAll({ status: 'ACTIVE' }),
});
queryClient.prefetchQuery({
  queryKey: queryKeys.categories, // array, no función
  queryFn: () => api.client.categories.findAll(),
});
```

**No** usar `ActivityIndicator` ni textos "Cargando…" al abrir tabs principales.

---

## 5. Checklist antes de mergear un PR frontend

### Diseño

- [ ] Colores neo usan utilidades `bg-neo-*` / `text-neo-*` (no hex sueltos salvo excepción)
- [ ] Bordes 3px y sombras duras en cards/paneles admin
- [ ] Copy en español
- [ ] `ProductImage` en vistas de producto (web y móvil)

### SSR / carga

- [ ] Páginas de datos: Server Component + `getServerApiClient`
- [ ] Clientes con React Query: `initialData` desde servidor
- [ ] Sin `loading.tsx`, skeletons de página ni spinners iniciales
- [ ] `Suspense` con `fallback={null}` si aplica

### Admin (si toca `/admin`)

- [ ] No reintroduce navbar/footer de tienda
- [ ] `AdminPageHeader` en páginas nuevas de listado
- [ ] Nav actualizado en `admin-nav.ts` + iconos sidebar
- [ ] Top bar móvil funcional (hamburger → Sheet)

### Fase 8 — Finanzas (post-merge)

- [ ] Rutas bajo `/admin/finance/*` con `finance/layout.tsx` (`financeRoles` + JWT nativo, **no Clerk**)
- [ ] Subpáginas con SSR: `getServerApiClient` + `initialData` en vistas cliente
- [ ] Sin skeletons en listados finance; usar `FormSelect` (no `<select>` nativo con Radix `Select`)
- [ ] Migración `20260629000000_phase8_income_order_fk` aplicada antes de deploy API
- [ ] `api-client` hooks finance + `client.finance.*` tras cambios en `client.ts`

### Animaciones

- [ ] Tokens de `@repo/shared-utils/neo-motion` para valores compartidos
- [ ] `useReducedMotion` respetado
- [ ] Admin sin transición de ruta duplicada en `template.tsx`

### Tests

```bash
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web test
pnpm --filter @repo/mobile typecheck
```

> `pnpm test` a nivel monorepo puede fallar en `@repo/api-client` (sin tests + build TS preexistente). Para frontend, ejecutar web y API por separado si hace falta.

---

## 6. Conflictos frecuentes al mergear

| Conflicto | Resolución |
|-----------|------------|
| PR añade `loading.tsx` | Rechazar; migrar a SSR + `initialData` |
| PR usa `Skeleton` en admin list | Usar datos SSR; skeleton solo si es acción en curso (`isPending`) |
| PR pone `Navbar` en admin layout | Mantener `StoreChrome`; admin usa `AdminTopBar` |
| PR usa `@theme inline` para colores neo | Mover colores a `@theme` en `globals.css` |
| PR anima todas las rutas en `template.tsx` | Conservar exclusión de `/` y `/admin/*` |
| PR móvil con spinner en `index`/`store` | Usar prefetch en `_layout.tsx` |
| PR duplica config de nav admin | Centralizar en `lib/admin-nav.ts` |
| Tests soporte buscan "Bandeja de soporte" | Título actual: **"Soporte"** (`AdminPageHeader`) |

---

## 7. Estructura de archivos de referencia

```
apps/web/src/
├── app/
│   ├── layout.tsx              # StoreChrome envuelve main
│   ├── template.tsx            # NeoPageTransition
│   ├── globals.css             # Tokens neo Tailwind v4
│   └── admin/
│       ├── layout.tsx          # Sidebar + TopBar + main
│       └── */page.tsx          # Server Components + fetch
├── components/
│   ├── admin/
│   │   ├── admin-page-header.tsx
│   │   └── orders-kanban.tsx
│   ├── layout/
│   │   ├── store-chrome.tsx
│   │   ├── admin-sidebar.tsx
│   │   └── admin-top-bar.tsx
│   ├── motion/
│   │   └── neo-page-transition.tsx
│   └── product/
│       └── product-image.tsx
└── lib/
    ├── api.ts                  # getServerApiClient
    └── admin-nav.ts

apps/mobile/src/
├── app/(tabs)/_layout.tsx      # prefetch catálogo
├── components/
│   ├── neo-screen.tsx
│   └── neo-animated.tsx
└── lib/api.ts

packages/shared-utils/src/
├── neo-motion.ts
└── product-image.ts
```

---

## 8. Credenciales dev (Playwright / QA manual)

```
Email:    store-admin@example.com
Password: SeedDemo123!
```

Otros roles en seed: `apps/api/prisma/seed/auth.ts` (`SEED_USER_PASSWORD` override opcional).

---

## 9. Al añadir una pantalla nueva

### Web — tienda o contenido

1. `page.tsx` async Server Component con `getServerApiClient`.
2. `AnimatedPageShell` + contenido.
3. Sin skeleton de carga.

### Web — admin

1. `page.tsx` async + fetch servidor.
2. Vista cliente con `initialData` si hay polling/filtros.
3. `AdminPageHeader` + tabla/formulario neo.
4. Registrar ruta en `admin-nav.ts` si es sección de menú.

### Móvil

1. Envolver en `NeoScreen` (`entrance={false}` si la pantalla anima su contenido).
2. Prefetch en `_layout.tsx` si es dato de catálogo caliente.
3. Sin spinner de página; empty states con texto.

---

*Si un PR contradice esta guía, priorizar estos patrones salvo que el PR documente explícitamente una excepción aprobada.*
