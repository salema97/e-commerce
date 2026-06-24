# Frontend — Phase 8–10 UI Closure (archived)

See `openspec/changes/archive/2026-06-24-phase-8-9-10-ui-closure/` for full SDD artifacts.

## Requirements

### Phase 8 finance UI parity

The web app MUST expose finance admin gaps and customer store-credit visibility.

#### Scenario: Admin uploads expense receipt
- GIVEN a finance user on `/admin/finance/expenses`
- WHEN they upload a receipt for an expense
- THEN the API `POST /v1/finance/expenses/:id/receipts` is called and the UI reflects success

#### Scenario: Customer views store credit on account hub
- GIVEN an authenticated customer with store credit
- WHEN they open `/account` via navbar
- THEN store credit balance is shown

### Phase 9 notifications and marketing UI parity

The web and mobile apps MUST wire push tokens and marketing distribution.

#### Scenario: Customer manages notification preferences
- GIVEN a signed-in customer
- WHEN they visit `/account/notifications`
- THEN email/push/marketing toggles persist via API

#### Scenario: Admin lists and distributes promotions
- GIVEN an admin on `/admin/marketing`
- WHEN the page loads
- THEN promotions list from API and distribute form is available

### Phase 10 AI and knowledge UI parity

The web app MUST expose public FAQ/CMS and admin knowledge management.

#### Scenario: Public FAQ page
- GIVEN published FAQs in seed
- WHEN a visitor opens `/help`
- THEN FAQs render in Spanish

#### Scenario: Public legal CMS page
- GIVEN CMS slug `politica-privacidad` in seed
- WHEN a visitor opens `/legal/privacy`
- THEN page content renders from CMS

#### Scenario: Admin manages FAQs and CMS
- GIVEN an admin user
- WHEN they open `/admin/knowledge`
- THEN FAQ and CMS CRUD views are reachable from sidebar
