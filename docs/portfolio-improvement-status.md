# Portfolio improvement implementation status

Updated: 2026-08-13. Code baseline: `c194ca19682b8fb219db1a863823a389344f1a17`.

## Implemented in this worktree

- PR0 guardrails: CI baseline artifacts, production audit, client secret/provider scan, bundle budgets, checksum migration runner with MySQL advisory lock.
- PR1: browser clients call `/api/ai/chat` and `/api/contact`; Gemini and EmailJS execute server-side; contact uses UUID idempotency plus delivery states and explicit admin resend.
- PR2: Ideas UI/service removed, mutations return `410`, GET is cursor-bounded and deprecated; admin uses stateful MySQL session, fixed 8-hour TTL, HMAC cookie, CSRF, revoke-current/all, exact-origin CORS and safe health endpoint.
- PR3/4: local Express uses the shared catch-all router, Zod boundaries, request IDs, structured request logs, audit logs, lazy pool, acquisition deadline, project transactions, duplicate-slug conflict mapping and cursor pagination.
- PR5/6: abortable resource hooks without module cache, partial Home state, one Home canvas, shared motion policy/Pause Motion, offscreen/hidden/reduced-motion frame suspension and modal focus trap.
- PR7A/8: BrowserRouter, safe legacy-hash redirect, `/work/:slug`, shared case-study UI, noindex 404, SPA fallbacks, admin search/filter/sort, bulk-delete confirmation, preview links, cursor load-more and delivery resend.

## Local verification evidence

- Reproducible install: `npm ci` succeeded from the updated lockfile.
- TypeScript and production build succeeded.
- Unit/security suite: 53 tests passed.
- Trust-boundary coverage: 83.8% statements, 74.11% branches, 89.33% functions and 90.06% lines.
- Production audit: zero high/critical; two React Router v6 moderate advisories remain because their fix requires the deliberately deferred v7 major upgrade.
- Client artifact/provider scan passed. Common JS is 371.16 kB raw (+1.59% from PR0); Neural Interface is 11.78 kB raw; no AI provider chunk exists.
- Playwright: 27 tests passed on desktop/mobile plus the 320/375/414/768/1440 responsive matrix; one duplicate matrix case is intentionally skipped in the mobile project.

## Deliberately gated

- Production migration, encrypted backup/restore rehearsal, secret rotation and 24–48 hour observation require deployment credentials and a production window.
- Per-project raw OG metadata, sitemap generated from live slugs and prerender are not enabled until `npm run spike:hosting -- <vercel-url> <cloudflare-url>` and bot raw-HTML checks pass on both targets.
- TanStack Query is deferred. The current implementation has no measured evidence for two of the three adoption gates; see `docs/decisions/001-tanstack-query-deferred.md`.
- Ideas archive/drop is not scheduled by the migration runner. It starts only after the production sunset and 14 days with zero GET traffic.

## Compatibility matrix

| Surface | Old caller | New contract | Compatibility |
| --- | --- | --- | --- |
| AI | Browser Gemini SDK | `POST /api/ai/chat` | Client adapter updated in same change |
| Contact | Browser EmailJS / `/send-email` | `POST /api/contact` + UUID idempotency | `/send-email` alias retains new semantics until real sunset |
| Admin auth | Bearer/localStorage | HttpOnly stateful cookie + CSRF | Legacy localStorage key is deleted on startup; `/admin/verify` is cookie-only deprecated alias |
| Projects public | Array | Array, maximum 100 | Unchanged |
| Projects admin | Array | `{items,pageInfo}` with `admin=true` | Admin caller opted in |
| Contact admin | Array | `{items,pageInfo}` | Facade keeps array helper and exposes page helper |
| Ideas GET | Array | `{items,pageInfo}` read-only | No runtime UI caller remains; endpoint is deprecated |
| Errors | `error: string` | String plus `code`, `fieldErrors`, `hint`, `requestId` | Client accepts current and future object error forms |

Every deployment PR must link the migration order, rollback instruction and affected row in this matrix.
