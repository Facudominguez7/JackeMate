# First-load performance

Objective: cut first-load latency of Reporty pages. Branch `perf/first-load` from main `c8a3607`. Delivery: ask-on-risk (forecast ~500 authored lines). Test runner: none in repo; checks are production build, lint, `tsc --noEmit`, curl timings, data-equivalence diff against a baseline, and a Playwright smoke run with system Chrome.

## Specs

- S1. User request (verbatim): "traete lo ultimo de main y desde ahi hay que revisar lo siguiente Optimizar todo porque anda medianamente lento en la primera carga"
- S2. Baseline (production build, measured 2026-10-20): `/reportes`, `/mapa`, `/comunidad` take 1.5-3.6 s server-side; `/` and `/auth` ~15 ms. One Supabase round trip costs 200-500 ms. Pages await 5-7 round trips sequentially and nothing is cached.
- S3. Rendered data must stay identical: same report ids and order, same `hasMore`, same authors and operational status, same community numbers.
- S4. No auth or security behavior changes (proxy session refresh stays as is).
- S5. User follow-up (verbatim): "Para los tiempos de carga tendrías que ver las queries, que no haya consultas N+1", "Si podes cachear algo también serviría", "Y si tiene que ver con imágenes ver la posibilidad de optimizarlas eso me dijeron".

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1-S4 | inline | done | Cache lookups (categorias, estados, prioridades) with `unstable_cache` and a cookie-less client; parallel awaits in /reportes, /mapa, /dashboard; drop unused `getUser` in /mapa |
| T2 | S1-S3 | inline | done | `getReportes`: replace `count: 'exact'` with `limite + 1`; fetch profiles and operational status in parallel |
| T3 | S1-S4 | inline | pending | Share one request-scoped `getUser` (React `cache`) between Header and pages |
| T4 | S1-S3 | inline | pending | /comunidad: parallel counts, profiles only for shown contributors |
| T5 | S1-S3 | inline | pending | Dashboard: remove N+1 in resolution time, parallel counts |
| T6 | S1-S3 | inline | pending | /reportes/[id]: run independent client loads in parallel |
| T7 | S1, S5 | inline | pending | Images: use thumbnails where full photos load on lists, popups and cards; check image weight and Next image optimization; loading skeletons for /mapa and /comunidad; split recharts |

## Log

- L1 (2026-10-20, user): "traete lo ultimo de main y desde ahi hay que revisar lo siguiente Optimizar todo porque anda medianamente lento en la primera carga"
- L2: Explorer mapped the first-load path. Root cause: sequential Supabase round trips, no caching, `count: 'exact'`, duplicate `auth.getUser` (proxy + Header + page), client-side waterfall on /reportes/[id], N+1 in dashboard analytics. Baseline outputs saved under /tmp/reporty-perf/base.
- L3 (2026-10-20, user): "Para los tiempos de carga tendrías que ver las queries, que no haya consultas N+1" / "Si podes cachear algo también serviría" / "Y si tiene que ver con imágenes ver la posibilidad de optimizarlas eso me dijeron"
- L4: T1+T2 done. Data identical to baseline (5 API queries, /reportes, /mapa, /comunidad). Timings: /mapa 1.4-3.6 s -> 0.43-0.50 s; /reportes 1.5-3.6 s -> 0.58-0.94 s. tsc and eslint clean. /api/reportes no longer returns `count` (its only caller, lista-reportes-client, never read it).
