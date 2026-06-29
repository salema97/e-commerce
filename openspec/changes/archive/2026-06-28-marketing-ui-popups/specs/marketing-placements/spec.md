# Marketing Placements Specification

## Purpose

Define a unified, admin-configurable system for visual marketing surfaces (popups, banners, promo strips) consumed by web and mobile storefronts, with optional linkage to existing promotions without duplicating the discount engine.

## Requirements

### Requirement: MarketingPlacement persistence model

The system MUST persist marketing placements in a `MarketingPlacement` table with at least the following fields:

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `type` | enum | `POPUP` \| `BANNER` \| `PROMO_STRIP` |
| `slot` | enum | `APP_LAUNCH` \| `HOME_HERO` \| `STORE_TOP` \| `STORE_INLINE` |
| `platform` | enum | `WEB` \| `MOBILE` \| `ALL` |
| `title` | string | Required, max 200 chars |
| `body` | string | Optional, max 2000 chars |
| `imageUrl` | string | Optional, valid URL |
| `ctaLabel` | string | Optional, max 80 chars |
| `ctaHref` | string | Optional, max 500 chars (internal path, product slug, or deep link) |
| `promotionId` | UUID | Optional FK to `Promotion`; MUST reference an existing promotion when set |
| `isActive` | boolean | Default `false` |
| `priority` | integer | Default `0`; higher wins on conflict |
| `startsAt` | datetime | Optional; inclusive start of scheduling window |
| `endsAt` | datetime | Optional; exclusive end; MUST be after `startsAt` when both set |
| `showOncePerSession` | boolean | Default `false` |
| `showOnceEver` | boolean | Default `false` |
| `contentVersion` | string | Required, max 32 chars; incremented on content changes that SHOULD reset dismiss state |
| `createdAt` / `updatedAt` | datetime | Auto-managed |

The system MUST enforce slot–type compatibility:

- `POPUP` MUST use slot `APP_LAUNCH` only.
- `BANNER` and `PROMO_STRIP` MUST NOT use slot `APP_LAUNCH`.
- `PROMO_STRIP` MAY use `HOME_HERO`, `STORE_TOP`, or `STORE_INLINE`.
- `BANNER` MAY use `HOME_HERO`, `STORE_TOP`, or `STORE_INLINE`.

When `promotionId` is set, the system MUST NOT require `ctaHref`; the client MAY derive CTA from the linked promotion. When both `ctaHref` and `promotionId` are set, `ctaHref` SHALL take precedence for navigation.

#### Scenario: Valid popup placement is persisted

- GIVEN an admin payload with `type=POPUP`, `slot=APP_LAUNCH`, `platform=ALL`, and required content fields
- WHEN the placement is created via admin API
- THEN a `MarketingPlacement` row is stored with the supplied values and a generated `contentVersion`

#### Scenario: Invalid slot for popup is rejected

- GIVEN an admin payload with `type=POPUP` and `slot=HOME_HERO`
- WHEN the create request is submitted
- THEN the API returns `400 Bad Request` and no row is created

#### Scenario: Unknown promotionId is rejected

- GIVEN an admin payload with a `promotionId` that does not exist
- WHEN the create or update request is submitted
- THEN the API returns `400 Bad Request` or `404 Not Found` and no invalid FK is stored

#### Scenario: Scheduling window is enforced on read

- GIVEN a placement with `isActive=true`, `startsAt` in the future
- WHEN a client calls the public active endpoint
- THEN that placement is NOT included in the response

---

### Requirement: Public active placements API

The system MUST expose `GET /v1/marketing/placements/active?platform=WEB|MOBILE` as a public, unauthenticated endpoint.

Query parameter `platform` is REQUIRED and MUST be either `WEB` or `MOBILE`.

The service MUST return only placements where:

1. `isActive=true`
2. Current time is within `[startsAt, endsAt)` when those fields are set (null bounds mean unbounded)
3. `platform` equals the query value OR `platform=ALL`

Resolution rules per slot:

1. Sort eligible placements by `priority` descending, then `updatedAt` descending
2. Return at most **one** `POPUP` per slot
3. Return all eligible `BANNER` and `PROMO_STRIP` placements per slot (no hard cap in MVP; clients render in order)

The response MUST include fields needed for client rendering and dismiss logic: `id`, `type`, `slot`, `title`, `body`, `imageUrl`, `ctaLabel`, `ctaHref`, `promotionId`, `showOncePerSession`, `showOnceEver`, `contentVersion`, and `priority`.

The endpoint SHOULD be cached in Redis with TTL between 60 and 120 seconds. Admin mutations MUST invalidate the cache for affected platform keys.

#### Scenario: Web client fetches home banners

- GIVEN two active `BANNER` placements for `HOME_HERO` with `platform=WEB` or `ALL`, priorities 10 and 5
- WHEN `GET /v1/marketing/placements/active?platform=WEB` is called
- THEN both banners are returned for `HOME_HERO` ordered by priority descending

#### Scenario: Only one popup per launch slot

- GIVEN three active `POPUP` placements for `APP_LAUNCH` with different priorities
- WHEN the public active endpoint is called
- THEN exactly one popup is returned for `APP_LAUNCH` (highest priority)

#### Scenario: Mobile-only placement excluded for web

- GIVEN an active placement with `platform=MOBILE`
- WHEN `GET /v1/marketing/placements/active?platform=WEB` is called
- THEN that placement is NOT in the response

#### Scenario: Missing platform query is rejected

- GIVEN a request without `platform`
- WHEN the public active endpoint is called
- THEN the API returns `400 Bad Request`

---

### Requirement: Admin CRUD with RBAC and audit

The system MUST expose authenticated admin endpoints under `/v1/marketing/placements`:

| Method | Path | Roles | Audit |
|--------|------|-------|-------|
| `GET` | `/v1/marketing/placements` | `SUPER_ADMIN`, `ADMIN` | No |
| `GET` | `/v1/marketing/placements/:id` | `SUPER_ADMIN`, `ADMIN` | No |
| `POST` | `/v1/marketing/placements` | `SUPER_ADMIN`, `ADMIN` | Yes |
| `PATCH` | `/v1/marketing/placements/:id` | `SUPER_ADMIN`, `ADMIN` | Yes |
| `DELETE` | `/v1/marketing/placements/:id` | `SUPER_ADMIN`, `ADMIN` | Yes |

Mutating operations MUST append an immutable `AuditLog` entry with actor, timestamp, resource `MarketingPlacement`, action, and diff snapshot per platform convention.

Roles other than `SUPER_ADMIN` and `ADMIN` MUST receive `403 Forbidden` on admin placement routes.

List endpoint MUST support filtering by `type`, `slot`, `platform`, and `isActive`, and pagination consistent with other admin list APIs.

Content mutations that change visible copy or image MUST bump `contentVersion` (admin MAY supply explicit version or service auto-increments).

#### Scenario: Admin creates placement with audit trail

- GIVEN an authenticated `ADMIN` user
- WHEN they `POST /v1/marketing/placements` with valid payload
- THEN the placement is created and an `AuditLog` record exists with action `create`

#### Scenario: Finance role cannot mutate placements

- GIVEN an authenticated `FINANCE` user
- WHEN they `POST /v1/marketing/placements`
- THEN the API returns `403 Forbidden`

#### Scenario: Deactivate placement stops public delivery

- GIVEN an active placement visible on the public endpoint
- WHEN an admin sets `isActive=false` via `PATCH`
- THEN subsequent public active responses exclude it after cache invalidation

---

### Requirement: Shared types and API client hooks

The system MUST publish DTOs in `@repo/shared-types` mirroring API validation rules.

The system MUST regenerate `@repo/api-client` with:

- `useMarketingPlacementsActive(platform)` for the public endpoint
- Admin hooks for list, get, create, update, delete

OpenAPI spec MUST document all placement endpoints under `/v1/marketing/placements`.

#### Scenario: Web app consumes generated hook

- GIVEN regenerated api-client after API merge
- WHEN web code calls `useMarketingPlacementsActive('WEB')`
- THEN TanStack Query fetches `/v1/marketing/placements/active?platform=WEB`

---

### Requirement: Demo seed data

The system MUST seed at least one demo `MarketingPlacement` of each type (`POPUP`, `BANNER`, `PROMO_STRIP`) plus at least one linked `Promotion` when seed runs, so local web/mobile demos render configured content without manual admin setup.

#### Scenario: Fresh dev database shows demo popup

- GIVEN a database after `prisma:seed`
- WHEN `GET /v1/marketing/placements/active?platform=WEB` is called
- THEN at least one `APP_LAUNCH` popup is returned

---

### Requirement: PR-1 acceptance (API slice)

PR-1 is complete when ALL of the following hold:

1. Prisma migration for `MarketingPlacement` is applied
2. Admin CRUD and public active endpoints behave per requirements above
3. `@Audit` and `@Roles` are applied on mutating admin routes
4. Redis cache with invalidation on mutations is implemented
5. `@repo/shared-types` DTOs and regenerated `@repo/api-client` hooks are merged
6. Demo seed placements exist
7. PR diff stays within the 400-line review budget

#### Scenario: PR-1 integration smoke

- GIVEN PR-1 merged to `main`
- WHEN an admin creates a WEB banner and a visitor calls the public active endpoint
- THEN the banner appears in the API response within cache TTL after invalidation

---

### Requirement: PR-2 acceptance (Admin slice)

PR-2 is complete when ALL of the following hold:

1. `MarketingSubNav` exposes **Campañas** and **Popups y banners** under `/admin/marketing`
2. Admin list and create/edit forms for placements exist with fields matching the model
3. Promotion selector lists existing promotions via read-only API (no promotion CRUD in this slice)
4. Slot and type validation errors surface in the UI
5. Mutations call admin placement API and reflect audit-capable backend
6. PR diff stays within the 400-line review budget

#### Scenario: Admin creates popup from UI

- GIVEN an `ADMIN` on `/admin/marketing/placements/new`
- WHEN they submit a valid APP_LAUNCH popup form
- THEN the placement is persisted and listed on the placements index

#### Scenario: Promotions CRUD is not exposed

- GIVEN an admin user
- WHEN they browse marketing admin sections
- THEN no UI exists to create or edit promotion rules (phase 2)
