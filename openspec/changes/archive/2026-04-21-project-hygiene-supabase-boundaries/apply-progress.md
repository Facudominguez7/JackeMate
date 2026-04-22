# Apply Progress: project-hygiene-supabase-boundaries

## Mode

Standard

## Completed Tasks

- [x] 1.1 Create baseline migration files under `supabase/migrations/` and document the access matrix for `reportes`, `profiles`, `comentarios_reporte`, `historial_estados`, `votos_*`, `fotos_reporte`, and bucket `reportes`.
- [x] 1.2 Add shared authz/constants modules in `lib/authz/*` for server-fetched role checks and catalog IDs consumed by report/admin flows.
- [x] 1.3 Harden `app/api/send-notification/route.ts` and `app/api/send-status-notification/route.ts` to require trusted server/session input instead of arbitrary client payloads.
- [x] 1.4 Add incremental migrations for table RLS + storage policies, enabling them table-by-table only after matching SELECT/INSERT/UPDATE paths are available.
- [x] 2.1 Create `lib/media/report-images.ts` with typed `{ bucket, path, publicUrl? }` parsing, dual-read URL resolution, and compatibility helpers.
- [x] 2.2 Update `database/queries/reportes/nuevo/subir-imagen.ts` and related create-report code to dual-write canonical bucket/path while preserving legacy compatibility data.
- [x] 2.3 Update read mappers in `database/queries/reportes/get-reportes.ts`, `database/queries/reportes/[id]/get-reporte-detalle.ts`, and `app/api/reportes/route.ts` to resolve legacy and canonical images without extra per-row fetches.
- [x] 2.4 Add resumable migration/backfill steps for `fotos_reporte` so old rows keep rendering before any legacy URL dependency is removed.
- [x] 3.1 Split read DTOs in `database/queries/reportes/get-reportes.ts` for list/map shapes and replace category/state/priority subqueries with explicit typed filter helpers/constants.
- [x] 3.2 Move dashboard/report ownership reads in `app/dashboard/page.tsx`, `app/reportes/page.tsx`, and `app/mapa/page.tsx` toward server/query loaders that reduce payload and browser joins.
- [x] 3.3 Refactor `database/queries/puntos.ts` and report detail mutation helpers to a measured server-owned atomic path or RPC before tightening concurrent flows.
- [x] 3.4 Add only evidence-backed indexes/advisor fixes in new migrations after verifying hot paths with real Supabase results.
- [x] 4.1 Create `lib/use-cases/reportes/*` server workflows for create report, vote, comment, and admin state changes; keep `database/queries/reportes/[id]/*` focused on reads.
- [x] 4.2 Update `app/reportes/nuevo/page.tsx` and `app/reportes/[id]/page.tsx` to call server actions/shims instead of browser-owned sensitive writes.
- [x] 4.3 Replace repeated `any` and inline helpers in `app/dashboard/page.tsx`, `app/reportes/[id]/page.tsx`, and `components/header.tsx` with typed view models and shared identity/media helpers.
- [x] 4.4 Normalize repeated role/state magic values into shared constants consumed by admin/report/dashboard modules before deleting compatibility shims.
- [x] 5.3 Confirm migration order, policy rollout notes, pending blockers, and cleanup items inside this `tasks.md` for `sdd-apply` continuity.

## Validation

- `npm run lint` ✅ passes with existing repo warnings only (React hook dependency warnings and legacy `<img>` usage in unrelated files).
- `npx tsc --noEmit` ✅ passes.
- Live Supabase verification ✅ captured current RLS/policy state for `public.*` tables and `storage.objects` before rollout; evidence informed `supabase/access-matrix.md`.
- Live Supabase verification ✅ confirmed `storage.buckets.public = true` for bucket `reportes`, verified current legacy image URLs are publicly reachable, and proved the resumable regex backfill derives canonical `{ bucket, path }` from existing `fotos_reporte.url` rows.
- Live Supabase verification ✅ confirmed `public.adjust_profile_points_atomic` does not exist yet in the live project, so the new RPC-first points helper correctly needs the compatibility fallback until migration `20260422032000_atomic_points_rpc.sql` is applied.
- Live Supabase verification ✅ confirmed unique vote indexes still exist on `(reporte_id, usuario_id)` for both `votos_no_existe` and `votos_reparado`, which is the database invariant now relied upon by the compare-and-set vote workflows.
- Live Supabase verification ✅ re-checked `pg_tables.rowsecurity` and the exposed tables targeted by this change (`reportes`, `comentarios_reporte`, `historial_estados`, `profiles`, `votos_*`) are still `false`, so 5.1 remains blocked on migration rollout instead of code wiring.

## Notes / Deviations

- Baseline migration is a tracked no-op adoption marker because the Supabase CLI is not installed in this workspace, so an automated remote schema pull could not be generated in this batch.
- Notification routes keep the existing UI trigger points but now ignore previously trusted client-owned identity/email/title payload fields and resolve those values server-side.
- Added `.eslintrc.json`, `eslint@8`, and `eslint-config-next@15.5.9` so the required lint command can run in this repository.
- The new image helpers and query fallbacks are compatibility shims: they intentionally retry with legacy `url`-only selects/inserts when `bucket` / `path` columns are not available yet, so app code can merge before the migration is applied.
- The live project revealed `storage.buckets.public = true` for `reportes`, which contradicted the earlier note that the bucket was private; the access matrix and migration strategy were corrected to remove broad listing policies instead of assuming signed/private reads.
- Points adjustments now try a service-role-only RPC first and fall back to the legacy read-modify-write path only when the new function is not deployed yet. That keeps rollout safe across environments while documenting the remaining race window until the migration lands.
- Report detail status transitions and soft deletes now use compare-and-set style updates, which prevents concurrent duplicate actions from silently double-awarding owner points or writing duplicate state history after the first request already won.
- Shared identity helpers now own display-name extraction, initials, and relation-name parsing so the touched dashboard/header/report-detail surfaces stop repeating `any`-driven access patterns.

## Remaining Tasks

- [ ] 5.1 Verify authorized and unauthorized Supabase behavior with real queries/observable results for create report, image upload, vote, comment, admin transition, and notification routes.
- [ ] 5.2 Run `npm run lint` and `npx tsc --noEmit`, then record manual smoke results for auth, dashboard, list/map/detail views, notifications, and legacy+canonical image rendering.
