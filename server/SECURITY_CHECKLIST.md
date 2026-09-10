# Production launch gate

The current browser app is a safe product prototype, not a production authentication or payment system. Before public launch:

- Put authentication, authorization, rate limiting, input validation, CSRF protection and audit logging on a server.
- Use hosted OTP/email authentication; hash passwords with Argon2id if passwords are enabled.
- Use the schema in `schema.sql`; expose random UUID public IDs, not database sequences.
- Keep authentication credentials in `auth_accounts`; keep public profile data in `app_users`; never return auth columns from public queries.
- Connect an external age/identity provider with a webhook that accepts only booleans and a random reference token.
- Reject government-ID files and numbers at API, upload, moderation, support and analytics boundaries.
- Put portfolio media in private object storage with signed URLs, malware scanning, MIME allow-lists and size limits.
- Use hosted checkout from a payment provider. Store only provider references and subscription state.
- Expose only plan identifiers to the payment endpoint; never accept card number, CVV, bank account or raw payment payloads.
- Enforce block/report checks before every message and connection request.
- Return `Cache-Control: no-store` on API responses and do not cache private profile, moderation, auth, or message data.
- Serve only an explicit allow-list of frontend assets; never expose source files, schemas, package metadata, environment files, or deployment configuration.
- Add per-user/IP rate limits and risk signals for spam, mass messaging, payment requests and account cycling.
- Restrict moderation routes by server-side role checks; record every moderation action in an append-only audit table.
- Encrypt in transit and at rest, rotate secrets, redact logs, and define deletion/retention schedules.
- Keep the 18+ dating/friendship module disabled until age verification, moderation staffing, abuse escalation and safety testing are complete.
- Define deletion/export workflows and retention periods before collecting production user data; deletion must cascade or anonymize messages, reports and profile media according to the documented legal policy.
- Require explicit confirmation for account deletion, execute it transactionally, revoke sessions at the auth provider, and verify backups/retention handling with the provider.
