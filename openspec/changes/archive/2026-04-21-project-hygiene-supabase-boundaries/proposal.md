# Proposal: Project Hygiene Supabase Boundaries

## Intent

Harden JackeMate without changing core UX: close unsafe Supabase access paths, restore schema change discipline, and reduce fragile client-side business logic. This master change optimizes compatibility and security over aesthetics through phased rollout, not a big-bang refactor.

## Scope

### In Scope
- Phase 1: define access matrix, adopt missing migrations baseline, harden RLS/storage/email endpoints, and introduce backward-compatible image refs (`bucket/path` + legacy `publicUrl` read support).
- Phase 2: move sensitive writes/business rules from browser pages to server actions/route handlers; reduce direct browser writes to near zero.
- Phase 3: tune Supabase reads with measured query shaping, payload reduction, and indexes only where verified.
- Phase 4: remove repeated `any`/magic IDs, isolate responsibilities, and add verification guardrails.

### Out of Scope
- Visual redesign, copy refresh, or UX reimagining.
- Full data-model rewrite, role-system redesign, or replacing Supabase.
- Big-bang page rewrites where current behavior can be preserved incrementally.

## Capabilities

### New Capabilities
- `supabase-security-boundaries`: access matrix, RLS/storage policy hardening, protected notification flows, and migration discipline.
- `report-media-reference-compatibility`: stable image storage references with backward-compatible rollout from DB `publicUrl`.
- `delivery-verification-guardrails`: measurable checks for schema, auth, critical flows, and regression safety.

### Modified Capabilities
- None.

## Approach

1. Security/RLS/storage/migrations first: freeze current schema as baseline, adopt tracked migrations, secure exposed tables/bucket policies, and protect notification APIs.
2. Client-server boundaries: move report creation, voting, comments, state changes, and points updates behind trusted server entrypoints.
3. Supabase/performance: consolidate hot-path queries, reduce round-trips, and apply measured indexing/advisor fixes.
4. Code hygiene: replace `any`, centralize catalog IDs/constants, and split overloaded modules by responsibility.
5. Reliability/verification: validate with real Supabase queries/results plus `npm run lint` and `npx tsc --noEmit`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/api/send-*/route.ts` | Modified | Authenticated, server-owned notification flows |
| `app/reportes/**`, `app/dashboard/page.tsx` | Modified | Browser stops owning sensitive writes/rules |
| `database/queries/**`, `utils/supabase/**` | Modified | Boundary split, query shaping, safer data access |
| `openspec/changes/project-hygiene-supabase-boundaries/` | New | Proposal/spec/design/tasks trail |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| RLS breaks current flows | Med | Move server entrypoints before tightening policies |
| Migration baseline drift | Med | Capture remote schema first, adopt one controlled baseline, then incremental diffs |
| Image rollout breaks existing records | Med | Dual-read legacy `url` + new `bucket/path`, backfill gradually |

## Rollback Plan

Ship by phase behind compatibility paths. If a slice fails, keep legacy reads enabled, revert the latest migration/policy set, and restore the prior server/client path for that flow only.

## Dependencies

- Supabase schema/policy audit and real query verification.
- Existing validation commands: `npm run lint`, `npx tsc --noEmit`.

## Success Criteria

- [ ] Critical tables/storage paths have explicit RLS/policies aligned to the access matrix.
- [ ] Sensitive mutations no longer depend on direct browser table writes.
- [ ] Images are stored by stable reference, while legacy `publicUrl` records still render during rollout.
- [ ] A tracked migration baseline exists and subsequent changes are incremental and reviewable.
- [ ] Critical flows preserve current behavior with verified results and no intentional UX regressions.
