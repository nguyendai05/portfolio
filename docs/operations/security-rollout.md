# Security and data rollout runbook

## Pre-deploy

1. Capture `npm ci`, Node/npm versions, lock hash, typecheck, tests, build, production audit, secret scan and bundle report from CI artifacts.
2. Create an encrypted database backup and restore it into an anonymized isolated database. Record backup ID, restore evidence, owner and expiry.
3. Run `npm run db:migrate` against the restored snapshot. Never use `--baseline` unless every migration effect is already present and independently verified.
4. Generate `ADMIN_PASSWORD_HASH` with `npm run admin:hash-password -- "..."`; configure independent session and rate-limit HMAC secrets.
5. Set exact `PUBLIC_ORIGIN`/`ALLOWED_ORIGINS`. Keep CSP report-only on Preview; review violations before enforcement.

## Migration/deploy order

1. Apply additive migration `0001_security_foundation.sql`.
2. Deploy server endpoints and compatibility aliases.
3. Deploy updated browser client in the same release for Ideas retirement and admin cookie auth.
4. Verify `/api/health`, login/session/logout, CSRF rejection, contact duplicate handling, AI provider failure mapping and admin pagination.
5. Rotate every Gemini/EmailJS credential ever exposed to a browser only after new server traffic is healthy.
6. Observe 401/403/429 rates, DB acquisition latency/timeouts, AI failures and contact delivery status for 24–48 hours before dependent work.

## Rollback/forward-fix

- DDL migrations are forward-fixed; do not automatically reverse columns/tables containing production data.
- Application rollback may target the previous build only while additive schema remains in place.
- If auth fails, keep mutations closed and restore the application; never re-enable bearer tokens.
- If EmailJS fails, preserve stored messages and delivery states. Do not mass-retry `unknown`; resend only from admin after provider investigation.
- Run authenticated `POST /api/admin/maintenance` periodically to enforce retention.

## Retention and privacy

- Bucket and expired/revoked session state: seven days after expiry/revoke.
- Admin audit: 180 days. Contact messages: 365 days, admin only.
- Only versioned HMAC identifiers are stored for client IP; never log raw IP or contact bodies.
- Ideas archive: backup, rename after sunset plus zero-traffic gate, retain 90 days, then use a separately approved drop migration.
