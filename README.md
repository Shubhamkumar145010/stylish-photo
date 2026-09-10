# LocalHelp

Privacy-first local discovery MVP for professionals, neighbourhood stores, and safe connection requests.

## What is implemented

- Responsive frontend for professional discovery and local store cart requests.
- Backend API with CORS allowlist, Helmet, request limits, validation, UUIDs, no-store API responses, and fail-closed dependencies.
- Separate authentication/profile/verification/moderation data boundaries.
- Reports, blocks, connection requests, messaging checks, moderation roles, audit events, and account deletion.
- Hosted-payment boundary that never accepts card data.
- External-verification boundary that stores only status/reference values.
- Privacy, terms, safety, deployment, and security documentation.

## Run locally

```powershell
npm ci
npm run preflight
npm run check
npm test
npm start
```

Without `DATABASE_URL`, the API intentionally reports degraded/not-ready status. It does not create demo users, OTPs, payments, or verification results.

For a local PostgreSQL/API stack, use `docker compose up --build` after reviewing the development-only placeholders in `docker-compose.yml`.

## Production launch gate

Do not launch publicly until all of these are configured and tested:

1. Managed OTP/email authentication and token revocation.
2. Managed PostgreSQL with encrypted backups and least-privilege credentials.
3. External age/identity verification provider returning only minimum statuses.
4. Hosted payment checkout and verified webhooks.
5. HTTPS, secret manager, exact CORS origin, monitoring, alerting, and backups.
6. Moderator dashboard, abuse escalation, report SLAs, and account-risk controls.
7. Portfolio-only upload policy with malware scanning and private signed URLs.
8. Privacy policy, terms, retention/deletion policy, and regional legal review.
9. Penetration test and abuse/rate-limit testing.
10. Dating/friendship module kept disabled until its full safety gate is approved.

## Non-negotiable privacy rule

Never upload or store Aadhaar, PAN, passport, driving licence, government ID numbers, biometrics, or raw identity-provider payloads in LocalHelp databases, object storage, logs, analytics, local storage, backups, support exports, or moderation tools.
