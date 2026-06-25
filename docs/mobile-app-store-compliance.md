# Mobile App Store Compliance Checklist

## General

- [ ] Privacy policy URL (`/legal/privacy`) linked in store listing
- [ ] Support contact email and WhatsApp visible in app
- [ ] App icons and splash screens for all required densities

## iOS (App Store)

- [ ] Sign in with Apple si ofreces login social de terceros (OAuth nativo)
- [ ] ATT prompt if tracking across apps (PostHog) — respect cookie/consent parity
- [ ] Push notification permission rationale in Spanish
- [ ] No IAP required for physical goods (e-commerce)

## Android (Google Play)

- [ ] Data safety form aligned with privacy export/delete flows
- [ ] Target API level meets Play policy
- [ ] Notification channels for order updates

## Build profiles

Use `eas build --profile preview` for staging and `--profile production` for store release.
