# Map first paint and perceived navigation speed

Objective: cut the LCP of the home map and give instant feedback on navigation. Branch `perf/map-first-paint` from main `6ada805`. Delivery: ask-on-risk (forecast ~250 authored lines). Test runner: none in repo; checks are production build, lint, `tsc --noEmit`, local LCP and request-chain measurements with throttling, chunk manifest inspection, and Playwright in a visible browser at 1920×1080, 1280×720 and 390×844.

## Specs

- S1. Production speed test reported by the user (Hostinger, reporty.com.ar): score 68, "Speed Index 10.9 s", "Largest Contentful Paint 6.5 s", "First Contentful Paint 1.3 s", "Cumulative Layout Shift 0", "Total Blocking Time 0 ms"; failing audits include "Avoid multiple page redirects", "Network dependency tree", "LCP request discovery", "Reduce unused JavaScript", "Improve image delivery".
- S2. Map loads in one step: the Leaflet code must not wait behind a second nested dynamic import; preconnect to the tile host; use the non-subdomain OSM tile URL. Map behavior (markers, clusters, popups, filters, selection mode in cuadrillas) stays identical.
- S3. `/` reaches `/mapa` without running the proxy and a page render (redirect at config level, same 307 semantics).
- S4. Routes without `loading.tsx` get one so links prefetch and clicks show a skeleton at once: `/mapa`, `/comunidad`, `/dashboard`, `/mis-reportes`, `/reportes/nuevo` (the last one currently shows the list skeleton).
- S5. Dashboard, Mis reportes and the map popup show the thumbnail instead of the full photo (fallback to the original when no thumbnail exists, as `/reportes` already does).
- S6. Recharts is downloaded only by users who actually see the analytics charts on `/dashboard`.
- S7. User approval (verbatim): "si" to "¿Arranco con los puntos 1 a 4?".

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T0 | S1 | inline | done | Baseline: production build, LCP and chunk chain on /mapa (L6) |
| T1 | S2 | inline | done (see git log) | Static Leaflet import in map-container; map chunk download starts when mapa-client evaluates; preconnect to tile host from MapaClient (SSR head); single-host OSM URL in the 4 maps (L7) |
| T2 | S3 | inline | done (see git log) | `redirects()` in next.config (307, runs before the proxy); app/page.tsx removed (L8) |
| T3 | S4 | inline | done (see git log) | loading.tsx for /mapa, /comunidad, /dashboard, /mis-reportes, /reportes/nuevo; new page skeletons (L9) |
| T4 | S5 | inline | done (see git log) | Dashboard items and map items use `getPreferredReportListingImageUrl` (L9) |
| T5 | S6 | inline | done (see git log) | `graficos-diferidos.tsx` with next/dynamic; page imports bypass the barrel (L8) |
| T6 | S1-S6 | delegated verifier | pending | Independent verification (no test runner, risk item 6) |

## Log

- L1 (2026-10-20, user): "investiga como puedo hacer el sistema mas rapido en cuanto a carga de tal manera se puede mejorar la experiencia ux/ui"
- L2: Explorer ranked remaining opportunities; parent verified that only /reportes, /reportes/[id] and /dashboard/cuadrillas have loading.tsx, and that `mapReportToDashboardItem` uses the full photo.
- L3 (2026-10-20, user): pasted the Hostinger speed test (see S1).
- L4: curl against production: http→https 301 (Hostinger CDN) then / → /mapa 307 (Next, after proxy auth and render); /mapa HTML no-store, TTFB ~0.6 s, brotli; `_next/static` immutable 1 year; OSM tiles `cache-control: no-cache`. Next's `next/dynamic` with `ssr: false` renders no chunk preload, so mapa-client → map-container → leaflet-map loads in sequence after hydration.
- L5 (2026-10-20, user): "si"
- L6: Baseline method. Run `next build --webpack` + `next start -p 3100` locally, then use system Chrome (headed, playwright-core in a temp dir; the Playwright MCP browser was held by another session) at 390×844 with DPR 2. Throttling: 150 ms RTT, 1.6 Mbps down, CPU 4×, cache disabled, origin storage cleared. Each run waits for the first loaded tile. The LCP element is always an OSM tile (`13/2823/4743.png`). Base (3 runs): LCP 6344/4484/4616 ms, FCP 1300-2128 ms. Chunks load in three waves: page (~2.0-2.4 s), then map-container (~2.6-2.95 s), then Leaflet (~2.8-3.15 s). The first tile request starts at 3.4-4.9 s.
- L7: T1 results. With the static Leaflet import the map code arrives in one wave. A server-component `preconnect()` only reached the RSC payload, not the HTML head; calling it in the client component MapaClient (rendered in SSR) emits `<link rel="preconnect" href="https://tile.openstreetmap.org"/>` in the head. Starting `import()` when the module evaluates cuts page-chunk start → map-chunk start from ~740 ms (base) to ~420 ms. 5 runs: LCP 5360/4688/4428/4188/4324 ms, median 4428 vs 4616 at the base (about −0.2 s). The remaining LCP time is the download of the 12 OSM tiles competing for bandwidth (first tile 3.1-4.0 s, LCP tile about 0.6 s later). That can only shrink with another tile provider (out of scope). tsc and eslint are clean.
- L8: T2 and T5 build checks. `/` now answers with a bare 307 to `/mapa` from the config redirect, with no page headers; the Next docs confirm the order headers → redirects → proxy. In the base build the client-reference manifest of `/dashboard/page` attached the recharts chunk (`7280`) to every client module, `components/ui/avatar.tsx` included. After T5, no chunk of any page client module contains recharts, and recharts is an async chunk (`3467.*`). The page imports `MapaCalorZonas` and the deferred charts directly, because the `@/components/dashboard` barrel re-exports the chart modules statically. tsc is clean; eslint reports 0 errors and 5 pre-existing warnings, all in files this change does not touch.
- L9: UX check in visible system Chrome (playwright-core; the Playwright MCP browser was held by another session) against `next start`, at 1920×1080, 1280×720 and 390×844:
  - `/` → `/mapa` takes one redirect; tiles come from `tile.openstreetmap.org` and markers render.
  - The map popup shows the WebP thumbnail (reports 45 and 30), and it loads.
  - With 1.2 s added latency, clicking Comunidad shows the 33-block `ComunidadLoadingSkeleton` and clicking Reportes shows the list skeleton within 250 ms. As a visitor, Crear goes to `/auth?next=/reportes/nuevo` (the existing proxy rule).
  - There is no horizontal overflow and no console error at any size.
  - The title placeholders of the new skeletons were centered to match `PageTitleBar`.
  - Pending: `/dashboard` and `/mis-reportes` need a signed-in session. Reading `.env` is denied in this session, so test users cannot be created and hard-deleted afterwards.
  - Advisory, already present before this change: the header logo loads only when the top header first appears, so it is missing from the skeleton under high latency.
