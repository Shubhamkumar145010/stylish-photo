# LocalHelp deployment runbook

## Before production

1. Replace every placeholder in `.env` and `docker-compose.yml` with secret-manager values. Never commit secrets.
2. Use managed PostgreSQL with encrypted storage, automated backups, point-in-time recovery, and a least-privilege database user.
3. Configure a managed authentication provider and set its issuer/audience/JWT signing configuration.
4. Configure HTTPS at the reverse proxy and set `ALLOWED_ORIGINS` to the exact production web origin.
5. Configure external verification and hosted payments. Store only status/reference fields and provider IDs.
6. Keep dating/friendship disabled until age verification, moderation staffing, abuse escalation, and safety tests are approved.
7. Run `npm ci`, `npm run check`, `npm test`, and `npm audit --audit-level=high` in CI.
8. Run database migrations in a controlled deployment job. Do not edit production tables manually.

## Local smoke test

```powershell
Copy-Item .env.example .env
docker compose up --build
Invoke-WebRequest http://localhost:3000/api/health
```

The health endpoint must report `database: "ok"` before accepting traffic. The sample compose credentials are for local development only and must never be used publicly.

## Render deployment

`render.yaml` defines one Docker web service and one managed PostgreSQL database. In the Render dashboard:

1. Create a Blueprint from this repository.
2. Set `ALLOWED_ORIGINS` to the exact HTTPS URL Render assigns to the web service.
3. Add managed authentication, payment, and external verification provider URLs only through Render secret environment variables.
4. Run the schema migration through a controlled release step before enabling traffic.
5. Confirm `/api/ready` returns `{"ready":true}` and review logs for secrets or sensitive payloads before launch.

Do not paste provider keys into source files, `render.yaml`, browser JavaScript, issue trackers, or chat messages.
