# Tasks: Project Hygiene Supabase Boundaries

## Dependencies / Blockers

- Baseline migration in `supabase/migrations/*` MUST land before any new schema/RLS/storage migration.
- RLS tightening on `public.*` and `storage.objects` MUST wait for server entrypoints/shims to be usable for create report, vote, comment, admin state change, and notifications.
- Canonical `{ bucket, path }` reads MUST ship with dual-read helpers before backfill/removal of legacy `fotos_reporte.url` assumptions.
- Index tasks wait for measured evidence from query payload/round-trip review and Supabase advisors.

## Phase 1: Seguridad / RLS

- [x] 1.1 Create baseline migration files under `supabase/migrations/` and document the access matrix for `reportes`, `profiles`, `comentarios_reporte`, `historial_estados`, `votos_*`, `fotos_reporte`, and bucket `reportes`.
- [x] 1.2 Add shared authz/constants modules in `lib/authz/*` for server-fetched role checks and catalog IDs consumed by report/admin flows.
- [x] 1.3 Harden `app/api/send-notification/route.ts` and `app/api/send-status-notification/route.ts` to require trusted server/session input instead of arbitrary client payloads.
- [x] 1.4 Add incremental migrations for table RLS + storage policies, enabling them table-by-table only after matching SELECT/INSERT/UPDATE paths are available.

## Phase 2: Storage / Modelado de imágenes

- [x] 2.1 Create `lib/media/report-images.ts` with typed `{ bucket, path, publicUrl? }` parsing, dual-read URL resolution, and compatibility helpers.
- [x] 2.2 Update `database/queries/reportes/nuevo/subir-imagen.ts` and related create-report code to dual-write canonical bucket/path while preserving legacy compatibility data.
- [x] 2.3 Update read mappers in `database/queries/reportes/get-reportes.ts`, `database/queries/reportes/[id]/get-reporte-detalle.ts`, and `app/api/reportes/route.ts` to resolve legacy and canonical images without extra per-row fetches.
- [x] 2.4 Add resumable migration/backfill steps for `fotos_reporte` so old rows keep rendering before any legacy URL dependency is removed.

## Phase 3: Queries / Índices

- [x] 3.1 Split read DTOs in `database/queries/reportes/get-reportes.ts` for list/map shapes and replace category/state/priority subqueries with explicit typed filter helpers/constants.
- [x] 3.2 Move dashboard/report ownership reads in `app/dashboard/page.tsx`, `app/reportes/page.tsx`, and `app/mapa/page.tsx` toward server/query loaders that reduce payload and browser joins.
- [x] 3.3 Refactor `database/queries/puntos.ts` and report detail mutation helpers to a measured server-owned atomic path or RPC before tightening concurrent flows.
- [x] 3.4 Add only evidence-backed indexes/advisor fixes in new migrations after verifying hot paths with real Supabase results.

## Phase 4: Refactor de componentes / helpers / tipos

- [x] 4.1 Create `lib/use-cases/reportes/*` server workflows for create report, vote, comment, and admin state changes; keep `database/queries/reportes/[id]/*` focused on reads.
- [x] 4.2 Update `app/reportes/nuevo/page.tsx` and `app/reportes/[id]/page.tsx` to call server actions/shims instead of browser-owned sensitive writes.
- [x] 4.3 Replace repeated `any` and inline helpers in `app/dashboard/page.tsx`, `app/reportes/[id]/page.tsx`, and `components/header.tsx` with typed view models and shared identity/media helpers.
- [x] 4.4 Normalize repeated role/state magic values into shared constants consumed by admin/report/dashboard modules before deleting compatibility shims.

## Phase 5: Verificación final

- [ ] 5.1 Verify authorized and unauthorized Supabase behavior with real queries/observable results for create report, image upload, vote, comment, admin transition, and notification routes.
- [ ] 5.2 Run `npm run lint` and `npx tsc --noEmit`, then record manual smoke results for auth, dashboard, list/map/detail views, notifications, and legacy+canonical image rendering.
- [x] 5.3 Confirm migration order, policy rollout notes, pending blockers, and cleanup items inside this `tasks.md` for `sdd-apply` continuity.

## Apply Notes

- 2026-04-21: Baseline adoption marker added in `supabase/migrations/20260421231500_baseline_adoption.sql` with rollout notes in `supabase/README.md` and `supabase/access-matrix.md`.
- 2026-04-21: `lib/authz/catalog.ts` and `lib/authz/roles.ts` now centralize role/state constants and profile-backed role checks used by report/admin flows.
- 2026-04-21: Notification routes now resolve caller identity and recipient/report metadata server-side from the session + DB instead of trusting arbitrary client payloads.
- 2026-04-21: `npm run lint` now executes after adding repo ESLint config plus compatible `eslint@8` / `eslint-config-next@15.5.9`; current validation still reports pre-existing warnings only.
- 2026-04-22: Added `lib/media/report-images.ts`, dual-write image inserts with pre-migration fallback, and read-side canonical image resolution with missing-column fallback so code can ship before the migration is applied.
- 2026-04-22: Added `supabase/migrations/20260422000500_report_image_compatibility_and_rls.sql` for resumable `fotos_reporte` backfill, evidence-backed indexes, safe lookup/image RLS, and removal of the broad public bucket listing policy after verifying `storage.buckets.public = true` for `reportes`.
- 2026-04-22: `database/queries/reportes/get-reportes.ts` now owns explicit typed list/map/dashboard DTO shaping plus constant-based filter resolution, removing the extra lookup-table round trips that previously happened for category/state/priority filters.
- 2026-04-22: `app/dashboard/page.tsx`, `app/reportes/page.tsx`, `app/mapa/page.tsx`, and `app/api/reportes/route.ts` now consume server/query loaders instead of browser-side joins or duplicate mapping logic; dashboard reads moved fully to the server.
- 2026-04-22: Added `lib/use-cases/reportes/detail-mutations.ts` and `app/reportes/[id]/actions.ts` so vote/comment/delete/admin state changes on report detail are now executed from trusted server actions even though create-report remains on the older client-owned path for now.
- 2026-04-22: Added `utils/supabase/admin.ts`, `lib/use-cases/reportes/create-report.ts`, and `app/reportes/nuevo/actions.ts` so create-report, image metadata writes, and detail mutations now execute from trusted server boundaries using the server-only `service_role` key instead of browser-owned table writes.
- 2026-04-22: Added `supabase/migrations/20260422013500_trusted_mutations_and_incremental_rls.sql` with advisor-backed FK indexes plus read-only RLS for `reportes`, `comentarios_reporte`, and `historial_estados`; `profiles` and vote tables remain for a later slice because current browser reads still need narrower policies/view-models.
- 2026-04-22: Added `supabase/migrations/20260422032000_atomic_points_rpc.sql` plus RPC-first fallback logic in `database/queries/puntos.ts`; full atomic guarantees start after this migration is applied, while pre-migration environments keep the compatibility fallback.
- 2026-04-22: `lib/use-cases/reportes/detail-mutations.ts` now treats report state changes and soft deletes as compare-and-set style updates (`neq/is null` + `select`) so duplicate votes/admin actions stop double-awarding points or double-writing history during concurrent requests.
- 2026-04-22: Added shared typed identity helpers in `lib/identity/display.ts`; `components/header*.tsx`, `app/dashboard/page.tsx`, and `app/reportes/[id]/page.tsx` now consume those helpers and shared catalog constants instead of `any`-driven relation parsing or inline magic role/state IDs.
- 2026-04-22: Rollout note — live Supabase still reports `public.adjust_profile_points_atomic` missing and `rowsecurity = false` on `reportes`, `comentarios_reporte`, `historial_estados`, `profiles`, and vote tables, so migration SQL is prepared but NOT deployed yet; finish 5.1 with authorized/unauthorized smoke after applying migrations in order.
