# Portfolio — Handoff Notes for the Next Agent

Last updated: 2026-05-23.
Owner: @annadpk444 (Nguyễn Xuân Đại — nguyendai05/portfolio).

This document is the single source of truth for **what has shipped, what is
still open, and where to look next** for anyone (human or AI) picking the
project up. Read this end-to-end before starting any new task.

---

## 1. Current state (TL;DR)

The portfolio is a Vite + React + TypeScript SPA backed by a MySQL database
exposed through a single Vercel serverless function (`api/[[...path]].ts`).
The site ships:

- Public Home / Work / About / Contact / Mentorship / Collaboration / Gallery
  pages with bilingual EN+VI copy, brutalist Xuni-Dizan aesthetic.
- An authenticated admin CMS at `#/admin/*` with full CRUD over
  projects / tools / skills / milestones / experiments / contact messages.
- DB-as-source-of-truth: `data/mockData.ts` has been deleted; public pages
  fetch live from `/api/*` and degrade to inline empty / skeleton states.

| Phase | Theme | Status | PR |
| --- | --- | --- | --- |
| 1 | Audit + DB schema baseline | merged | (legacy) |
| 2 | API consolidation to a single Vercel function | merged | [#9](https://github.com/nguyendai05/portfolio/pull/9) |
| 3 | Admin CMS (login, CRUD pages, contact inbox) | merged | [#9](https://github.com/nguyendai05/portfolio/pull/9) |
| 4 | Public polish (IdentityIntro, CapabilityMap, Toolkit, chips) | merged | [#10](https://github.com/nguyendai05/portfolio/pull/10) |
| 5 | DB-driven public pages (drop mockData fallback) | merged | [#11](https://github.com/nguyendai05/portfolio/pull/11) |

---

## 2. What is still open (work the next agent should pick from)

The original brief had 7 phases. Phases 1–5 are merged. Phases 6–8 plus a
small backlog accumulated during testing are listed here, in priority order.

### 2.1 — Phase 6: refactor `services/portfolioService.ts`

**Why:** `services/portfolioService.ts` is now ~380 lines and mixes
public, admin, and auth helpers in a single file. A single failed request
returns no shared error metadata, has no retry, and uses a custom
`ApiError` class but doesn't expose typed network-error vs.
business-error distinction to callers.

**Suggested approach:**

- Split into resource-scoped modules: `services/api/projects.ts`,
  `services/api/skills.ts`, `services/api/awards.ts`,
  `services/api/experiments.ts`, `services/api/contact.ts`,
  `services/api/admin.ts`, with a shared `services/api/client.ts` for
  the fetch wrapper.
- Add an internal `withRetry` for GETs (exponential backoff, max 2 retries,
  abort on `AbortSignal`).
- Surface a discriminated `Result<T, ApiError>` type or just keep throwing
  but standardize the `code` / `hint` shape so the UI can render
  user-friendly fallback copy.
- Export typed React hooks (e.g. `useProjects()`, `useSkills()`) instead
  of forcing every page to wire `useEffect` + `Promise.allSettled` by
  hand. Right now `pages/Home.tsx` and `pages/Work.tsx` duplicate this
  pattern with subtle differences.

**Pointers:** existing file: `services/portfolioService.ts`. Callers:
`pages/Home.tsx`, `pages/Work.tsx`, `components/about/Toolkit.tsx`,
`pages/admin/*.tsx`. Tests: none yet; consider adding `vitest` coverage
during this refactor (config is already present at `vitest.config.ts`).

### 2.2 — Mobile audit

**Why:** Phase 4 introduced 3 new full-bleed sections (IdentityIntro,
CapabilityMap, Toolkit) and modified Work cards. They were designed
mobile-first but never tested on a real device. Areas of risk:

- IdentityIntro 2-col → 1-col stack: stats grid (`grid-cols-2`) might
  overflow on devices <320px.
- WorkColumns tech chips: now visible by default; on narrow viewports the
  +N pill can wrap awkwardly.
- CapabilityMap and Toolkit: 3-col → 1-col responsive switch happens at
  `lg`; consider `md` for tablets.
- Hero `GenerativeArt` is already deferred 1.5s on mobile (good); double
  check LCP / CLS via Chrome DevTools mobile audit.

**Suggested approach:** open the Vercel preview on real devices (320px,
375px, 414px iPhone widths; 768px iPad), screenshot every page, log issues.
Fix in a single PR with before/after screenshots.

### 2.3 — `/work/:slug` deep-link route

**Why:** Currently every project opens in `ProjectModal` keyed off in-page
state. There is no shareable URL for an individual project. The brief
asked for "project detail (modal or `/work/:slug`)" and we shipped only
the modal.

**Suggested approach:**

- Add a route `<Route path="/work/:slug" element={<ProjectDetail />} />`
  in `App.tsx`.
- New page `pages/ProjectDetail.tsx` that calls `fetchProjectBySlug()`
  (already exists in `services/portfolioService.ts`).
- Reuse the layout/sections of `ProjectModal` so the modal and the page
  share a `ProjectCaseStudy` component.
- On `/work`, link each card to `/work/<slug>` (the modal can stay as a
  hover/click preview, or be removed in favor of the route — open
  question).
- Add OG / Twitter meta tags per project once `react-helmet-async` or
  similar is wired up (see 2.5).

**Pointers:** API already supports `GET /api/projects?slug=<slug>` via
`fetchProjectBySlug()`. `data/projectTranslations.ts` has the per-slug
localized copy that `localizeProject()` applies — make sure the detail
page calls it the same way modal/card do.

### 2.4 — Admin UX polish

**Why:** Admin pages work but are minimal. Risk grows once the DB has
>20 projects.

**Suggested approach:**

- `pages/admin/AdminProjectsList.tsx` (and friends): add a top filter
  bar — search by title/slug, filter by project_type (project|tool),
  filter by `featured`. Sort options: created_at DESC, title ASC.
- Bulk actions: toggle featured on selection, delete selection
  (require a confirm modal).
- Preview button per row: opens the public page (`/work` or `/work/:slug`
  once that exists) in a new tab so the admin can verify before publishing.
- Audit form validation (`AdminProjectForm.tsx` — phases textarea is
  free-form; consider a tag input).
- Add empty states with a clear "Create your first project" CTA when the
  DB is empty.

**Pointers:** `pages/admin/AdminProjectsList.tsx`,
`pages/admin/AdminSkills.tsx`, `pages/admin/AdminMilestones.tsx`,
`pages/admin/AdminExperiments.tsx`, `pages/admin/AdminMessages.tsx`,
`pages/admin/AdminProjectForm.tsx`. Shared UI:
`components/admin/AdminUi.tsx`.

### 2.5 — SEO + OG metadata

**Why:** The site currently relies on the static `<title>` in `index.html`
and a generic OG image. Every page deep-link looks identical when shared.

**Suggested approach:**

- Install `react-helmet-async` (or use `@vercel/og` later for dynamic
  images).
- Wire per-page `<Helmet>` blocks with title, description, og:image,
  twitter:card, canonical url. Pages: Home, Work, About, Contact,
  Mentorship, Collaboration, Gallery, and (once 2.3 ships)
  `/work/:slug`.
- Generate per-project OG images on the fly using `@vercel/og` (the
  catch-all serverless function can host this; add a `/api/og?slug=...`
  route inside `server/router.ts`).
- Add a `sitemap.xml` build step. Pull slugs from the DB at build time
  via a tiny script in `scripts/generate-sitemap.ts`.

### 2.6 — Analytics dashboard for admin

**Why:** Vercel Speed Insights and basic page-view counts already ship in
production, but the admin has no in-app visibility.

**Suggested approach:**

- Decide on the source: Vercel Analytics API, Plausible, or self-rolled
  table `page_views` in MySQL with a `GET /api/analytics/track?path=...`
  beacon.
- New admin page `pages/admin/AdminAnalytics.tsx` showing:
  - Page views over the last 30 days (line chart).
  - Top 10 projects by view count.
  - Contact form submissions over time (already in
    `contact_messages.created_at`).
- If self-rolled, add a `page_views` table to `db/schema.sql` and
  route handlers in `server/router.ts`.

### 2.7 — Cloudflare Workers parity

**Why:** `wrangler.jsonc` currently deploys the `dist/` directory as a
static SPA. The frontend therefore works on the Cloudflare domain, but
the API does not (it lives only on Vercel). If you ever want to drop
Vercel, you'd need to port `server/router.ts` to a Workers script.

**Suggested approach:** keep Vercel as the primary deploy target for now.
If you ever migrate: port `server/router.ts` to a Workers handler
(`fetch(req, env)`), replace `mysql2` with the Cloudflare Hyperdrive +
mysql worker pattern, and update `wrangler.jsonc` with both an `assets`
binding and a `main` entry.

### 2.8 — Test coverage

`vitest` is installed and `vitest.config.ts` exists, but there are
zero tests. Critical surfaces to cover when the next agent has the
appetite:

- `server/router.ts` — at least one happy-path test per resource (GET +
  POST round-trip with a sqlite shim or a `pg-mem`-style fixture).
- `services/portfolioService.ts` — assert the URL shape for every public
  method, mock `fetch`.
- `data/projectTranslations.ts` — assert that every slug in `db/schema.sql`
  has a VI override (catches drift).

### 2.9 — Minor backlog discovered during Phase 4 / Phase 5

- The `loadError` state I started in `pages/Home.tsx` was removed in
  Phase 5 (empty states cover the common case). If you want a visible
  retry pill ("Couldn't reach the API — Retry"), reintroduce it as a
  thin banner inside `<IdentityIntro>` or beneath the hero.
- `WorkHero.tsx` shows a static `404` for "commits" — replace with a
  real number from the `awards.length + experiments.length` sum or
  fetch from GitHub's `repos/.../stats` API.
- `home.intro.statSkills` label uses the live skill count; once 50+
  skills are in the DB the stats card layout might want a "+N more"
  format.
- The marquee section is now hidden when `skills.length === 0`. If
  you reintroduce a fallback dataset, remove that guard.

---

## 3. Architecture pointers

```
api/[[...path]].ts          # The ONE Vercel function. 5 lines, delegates to:
server/router.ts            # Method+path dispatch for every /api route.
server/{db,auth,projects,
       contact-messages,
       email}.ts             # Resource-scoped helpers (NOT counted as functions).
api-server.mjs              # Local dev wrapper around the same router.

services/portfolioService.ts # Client-side fetch helpers (typed).

pages/Home.tsx              # Identity-led landing.
pages/Work.tsx              # Projects + tools, tabs + filters.
pages/About.tsx             # Manifesto + bio + toolkit (Phase 4).
pages/admin/*.tsx           # CMS pages, gated by AdminGuard.

components/home/IdentityIntro.tsx    # Phase 4.
components/home/CapabilityMap.tsx    # Phase 4.
components/about/Toolkit.tsx         # Phase 4.
components/WorkColumns.tsx           # Card grid; tech chips visible by default (Phase 4).
components/WorkHero.tsx              # Stateless after Phase 5 (totalProjects + uniqueCategories props).

data/translations.ts        # 1k+ EN+VI strings.
data/projectTranslations.ts # Per-slug VI overrides for projects.

db/schema.sql               # The single source of truth for content. Includes seeds.

wrangler.jsonc              # Cloudflare static-asset deploy for dist/.
vercel.json                 # API rewrites + headers.
.env.example                # Required env vars.
```

### Data flow

1. Admin saves an entity through `pages/admin/*` → `services/portfolioService.ts`
   → `api/[[...path]].ts` → `server/router.ts` → `server/<resource>.ts` →
   MySQL.
2. Public page mounts (e.g. `pages/Home.tsx`) → `services/portfolioService.ts`
   → `/api/*` → server stack → MySQL.
3. Public page renders skeleton / empty state / data per the `null` / `[]`
   model introduced in Phase 5.

---

## 4. Quick start for the next agent

```sh
# 1. Clone + install
git clone https://github.com/nguyendai05/portfolio.git
cd portfolio
npm install

# 2. Bring up MySQL locally (or point at a remote)
mysql -u root -p < db/schema.sql

# 3. Configure env (see .env.example)
cp .env.example .env
$EDITOR .env   # set DATABASE_URL, ADMIN_TOKEN, ADMIN_PASSWORD, etc.

# 4. Dev
npm run dev:full   # starts Vite + api-server.mjs concurrently
# OR
npm run dev        # frontend only (Vercel preview API will be hit)

# 5. Build + lint
npm run build      # tsc + vite build; must pass before opening a PR
```

### Required env vars (see `.env.example` for the full list)

- `DATABASE_URL` — MySQL connection string (or `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` if you prefer split vars).
- `ADMIN_TOKEN` — long random string; bearer token for every admin write.
  Generate with `openssl rand -hex 32`.
- `ADMIN_PASSWORD` — used by `POST /api/admin/login` to mint a token.
- `EMAILJS_*` (`SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY`, `PRIVATE_KEY`) — used by `POST /api/send-email` for the contact form. Optional in dev.

---

## 5. Things to NOT do

- **Do not** re-introduce `data/mockData.ts` as a fallback. If the DB
  is down, show the dashed empty states — that is intentional.
- **Do not** split `api/*` back into one-file-per-endpoint. Vercel Hobby
  caps at 12 functions; we are at 1 and want to stay there.
- **Do not** edit `db/schema.sql` in place to add a new column without
  also adding a migration step somewhere obvious (the project does not
  currently use a migration framework — keep changes in `db/schema.sql`
  and document the upgrade path in the PR).
- **Do not** modify `dist/` directly; it is regenerated on every build.
- **Do not** change public API contracts without updating
  `services/portfolioService.ts` and every caller in the same PR.
- **Do not** push to `main` directly; open a PR from a `devin/<ts>-...`
  branch and wait for CI (Vercel + Workers Builds) to be green.

---

## 6. Useful references

- Live site (production): inferred from Vercel project `portfolio`
  (`https://portfolio-...-vercel.app`). Check the
  [Vercel dashboard](https://vercel.com/daivan060307-gmailcoms-projects/portfolio)
  for the canonical domain.
- Database schema + seeds: [`db/schema.sql`](../db/schema.sql).
- Admin entry: `https://<host>/#/admin/login`.
- EmailJS setup notes: [`EMAILJS_SETUP.md`](../EMAILJS_SETUP.md).
- Past sessions:
  - PR #9 (API consolidation + CMS): https://github.com/nguyendai05/portfolio/pull/9
  - PR #10 (public polish): https://github.com/nguyendai05/portfolio/pull/10
  - PR #11 (drop mockData fallback): https://github.com/nguyendai05/portfolio/pull/11

---

## 7. When you (next agent) finish a task

Add a row to the table in §1 and append a short bullet in §2.9 if you
discover a new piece of debt. Keep this doc tight — anything that
becomes obvious from the codebase itself can be removed once it stops
being useful.
