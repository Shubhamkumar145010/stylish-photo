# LocalHelp security-first MVP

## Privacy boundary

LocalHelp must never receive or store Aadhaar, PAN, passport, driving licence images, government ID numbers, biometrics, or raw verification payloads. If age or identity verification is introduced, an external provider performs it and LocalHelp receives only:

- `identity_verified`
- `age_verified`
- `provider_verified`
- `verification_provider_reference` (random non-sensitive token)

The reference must not be a document number. Do not put verification payloads in logs, analytics, backups, local storage, or support exports.

## Required production services

- Managed authentication with OTP/email verification and brute-force protection.
- Relational database with separate auth, profiles, verification status, messages, payments, and moderation tables.
- Object storage with an allow-list for portfolio media only; reject identity documents by MIME, size, malware scan, and content policy.
- Payment provider with hosted checkout. LocalHelp stores provider customer/payment references only, never card data.
- Moderation queue with report, block, rate-limit, audit events, and account-risk hooks.

## Authorization rules

Every API request must authorize against the authenticated user and resource owner. Public responses use random public IDs, coarse areas, and redacted contact data. Provider phone/email stays private until a controlled connection or booking flow.

## Dating/friendship gate

The 18+ module is disabled by default in this MVP. Enable only after age verification, moderation, abuse reporting, block controls, safe messaging, rate limits, suspicious-account detection, and a documented response process are implemented.
