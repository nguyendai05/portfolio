# SEO rendering spike

Per-project raw metadata remains gated; generic metadata stays active meanwhile.

1. Produce a candidate build-time `dist/work/<slug>/index.html` using one authoritative slug source.
2. Run `npm run spike:hosting -- <vercel-preview-url> <cloudflare-preview-url>` and Playwright with `BASE_URL` against each target.
3. Fetch `/work/<real-slug>` with a bot user agent and assert title, description, canonical and OG tags exist before JavaScript.
4. Prefer prerender only when data is current for the deployment and both hosts serve the file before SPA fallback.
5. If prerender fails, spike HTML rendering inside the existing catch-all function and load Vite's manifest. Do not add another function.
6. If neither approach passes, retain generic metadata. Do not publish hydration-only project OG tags as raw crawler metadata.

Only after the spike passes may sitemap/robots and per-project metadata ship; the build must then fail when an artifact or canonical URL is invalid.
