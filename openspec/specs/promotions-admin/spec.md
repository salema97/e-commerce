# Promotions Admin Specification

See `openspec/changes/archive/2026-06-28-promotions-admin-crud/` for full SDD artifacts.

## Purpose

Enable staff to manage promotions, coupons, and discount rules from the admin panel via a REST API consistent with domain controllers (`/v1/promotions`).

## Requirements

### Requirement: Promotions admin API

The system MUST expose authenticated admin endpoints under `/v1/promotions` for `SUPER_ADMIN` and `ADMIN` only.

| Method | Path | Action |
|--------|------|--------|
| GET | `/v1/promotions` | List promotions (optional filters: `isActive`, `type`) |
| GET | `/v1/promotions/:id` | Get promotion with `coupons` and `discountRules` |
| POST | `/v1/promotions` | Create promotion |
| PATCH | `/v1/promotions/:id` | Update promotion |
| DELETE | `/v1/promotions/:id` | Delete promotion |

Nested: coupons (`POST :id/coupons`, `PATCH/DELETE coupons/:couponId`) and rules (`POST :id/rules`, `PATCH/DELETE rules/:ruleId`). All mutations MUST append `AuditLog`.

### Requirement: Marketing promotion picker unchanged

`GET /v1/marketing/promotions` returns active promotions `{ id, name }[]` for campaigns and placement selectors.

### Requirement: Checkout integration unchanged

`PromotionService` applies coupons from DB state managed by admin CRUD.
