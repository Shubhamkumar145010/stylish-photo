# LocalHelp API

This is a fail-closed backend foundation for the LocalHelp MVP.

## Local development

1. Copy `.env.example` to `.env`.
2. Set a random `JWT_SECRET` with at least 32 characters.
3. Create PostgreSQL database `localhelp`.
4. Apply `schema.sql` with a migration tool or `psql`.
5. Install dependencies with `npm install`.
6. Start with `npm start`.

Without `DATABASE_URL`, the process can boot only as a development shell and health returns `503`. Without a configured authentication provider, OTP requests return `503/501`; the server never generates demo OTPs.

## API boundary

- `GET /api/health`
- `GET /api/ready`
- `GET /api/professionals?category=Digital&area=Delhi&limit=20`
- `POST /api/auth/request-otp`
- `POST /api/reports` (Bearer token required)
- `POST /api/blocks` (Bearer token required)
- `DELETE /api/account` (Bearer token required; body must contain `{"confirmation":"DELETE_MY_ACCOUNT"}`)
- `POST /api/billing/checkout` (Bearer token required; hosted payment provider boundary)
- `POST /api/connections` (Bearer token required; blocked pairs rejected)
- `POST /api/messages` (Bearer token required; blocked pairs rejected)
- `GET /api/moderation/reports` (moderator/admin token required)
- `PATCH /api/moderation/reports/:reportId` (moderator/admin token required)

Run `npm test` to execute the fail-closed API checks.

For a reproducible local PostgreSQL/API environment, see `../docker-compose.yml` and `../DEPLOYMENT.md`. The compose file contains development placeholders only.

Authentication tokens must come from the configured managed auth provider and be verified with the configured issuer, audience, and secret. The API intentionally does not implement fake login, local OTP storage, government-document upload, or raw identity-provider payload handling.
