# Design: Project Hygiene Supabase Boundaries

## Technical Approach

Implement this as four compatibility-first slices: (1) baseline Supabase adoption and access matrix, (2) trusted server mutations, (3) query/use-case split and measured read tuning, (4) cleanup and guardrails. This follows the proposal/specs and keeps legacy reads active until each server path is verified.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Layer split | Keep pages/components for presentation, `app/**/actions.ts` or `app/api/**` for entrypoints, `database/queries/**` for reads, `lib/use-cases/**` for mutations/business rules, `lib/authz/**` for role/access checks | Keep current browser-owned helpers; move everything into SQL/RPC immediately | Preserves Next/Supabase patterns already present while separating UI, data access, business logic, and authz. |
| Authz source | Authorize from server-fetched profile/role data, not `user_metadata`; keep catalog constants in shared typed modules only during transition | JWT `user_metadata`; hardcoded IDs everywhere | Matches Supabase guidance and avoids stale/editable claims. |
| Mutation model | Sensitive writes become server-owned orchestrations: create report, upload image metadata, vote, comment, admin status change, notifications, points/history | Direct browser table writes with helper chaining | Current flows have partial side effects and race windows; server orchestration gives one trusted place for validation and rollback. |
| Storage model | Canonical media reference becomes `{ bucket, path }`; keep legacy `url` dual-read until backfill completes; resolve URLs at runtime in shared mapper | Keep `publicUrl` in DB forever; big-bang rewrite | Lets bucket policy own access while preserving existing images/UI. |

## Data Flow

`Client page/form` -> `server action / route handler` -> `authz + use-case` -> `Supabase server client` -> `tables/storage`
`list/map/dashboard/detail` -> `query module` -> `DTO mapper (+ image URL resolver)` -> `UI`

## File Changes

| File | Action | Description |
|---|---|---|
| `app/reportes/nuevo/page.tsx` | Modify | Submit to server action, keep optimistic UX/loading/toasts. |
| `app/reportes/[id]/page.tsx` | Modify | Replace direct vote/comment/admin mutations with server entrypoints. |
| `app/dashboard/page.tsx` | Modify | Move analytics/report ownership reads to server-driven loaders. |
| `app/api/send-notification/route.ts` | Modify | Require trusted caller/session and remove arbitrary client payload trust. |
| `app/api/send-status-notification/route.ts` | Modify | Same as above for state-change notifications. |
| `database/queries/reportes/get-reportes.ts` | Modify | Split DTOs by list/map and stop repeated catalog subqueries. |
| `database/queries/reportes/[id]/*` | Modify | Keep pure reads only; extract mutation orchestration out. |
| `database/queries/puntos.ts` | Modify | Replace read-modify-write with server-owned atomic path/RPC. |
| `lib/use-cases/reportes/*` | Create | Trusted create/vote/comment/change-state workflows. |
| `lib/authz/*` | Create | Role matrix, actor checks, shared authz helpers. |
| `lib/media/report-images.ts` | Create | bucket/path parser, dual-read resolver, runtime signed/public URL strategy. |
| `supabase/migrations/*` | Create | Baseline plus incremental schema/RLS/storage migrations. |

## Interfaces / Contracts

```ts
type ReportImageRef = { bucket: 'reportes'; path: string; publicUrl?: string | null }
type ReportListItem = { id:number; title:string; status:string; imageUrl:string | null }
type ReportMapItem = { id:number; lat:number; lon:number; status:string; imageUrl:string | null }
type ReportDetailView = ReportListItem & { description:string; comments: CommentView[]; history: HistoryView[] }
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | authz helpers, media resolver, DTO mappers | TypeScript unit-friendly pure functions as modules are extracted. |
| Integration | server actions/routes + RLS/policies + storage rules | Real Supabase queries/observable results; verify authorized and unauthorized cases. |
| E2E/Smoke | auth, create report, image upload/render, vote/comment, admin transition, dashboard, list/map/detail | Manual smoke plan plus `npm run lint` and `npx tsc --noEmit`. |

## Migration / Rollout

1. **Baseline adoption**: create `supabase/migrations`, capture current remote schema as baseline, do not mix schema edits into that commit, and verify `supabase migrations list` once CLI is available locally. Current DB evidence: no tracked migrations, RLS disabled on `reportes`, `profiles`, `comentarios_reporte`, `historial_estados`, `votos_*`, `fotos_reporte`, `roles`, `estados`.
2. **Compatibility schema**: add nullable `bucket`/`path` to `fotos_reporte`, optional helper indexes, and policy scaffolding; keep `url` reads alive.
3. **Server-boundary rollout**: ship new server mutation paths first, then enable RLS table-by-table with matching SELECT+INSERT/UPDATE policies. Storage policies should scope `storage.objects` by `bucket_id='reportes'` plus folder ownership rules; remove broad listing once runtime URL resolution works.
4. **Backfill + tighten**: backfill legacy rows to bucket/path, switch reads to canonical fields, then drop obsolete policy/url dependencies in a later migration.

## Open Questions

- [ ] Should report images remain publicly readable after transition, or move to signed URLs for all detail/list/map surfaces?
- [ ] Do we prefer SQL RPC for atomic points/state transitions, or TypeScript server transactions if flow complexity stays app-side?
