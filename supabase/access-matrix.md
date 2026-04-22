# Supabase access matrix — `project-hygiene-supabase-boundaries`

Compatibility-first rollout target for the current JackeMate flows.

## Evidence captured from live project

- `public.reportes`, `public.profiles`, `public.comentarios_reporte`, `public.historial_estados`, `public.votos_no_existe`, `public.votos_reparado`, `public.fotos_reporte`, `public.roles`, and `public.estados` currently have RLS disabled.
- `storage.objects` already has RLS enabled with authenticated `SELECT` / `INSERT` / `UPDATE` / `DELETE` policies for bucket `reportes`.
- Bucket `reportes` currently exists and is public, so object URLs work without a broad `storage.objects` listing policy.

## Access matrix

| Resource | Read | Write / mutate | Trusted boundary for rollout | Notes |
|---|---|---|---|---|
| `public.reportes` | Public list/detail reads for non-deleted rows | Trusted server insert/update/delete only | Server action + use-case + service-role server client | Browser-owned writes were removed from create/detail flows, so read-only RLS is now safe for this table. |
| `public.profiles` | Owner reads own full row; shared identity reads go through `public.public_profiles`; trusted/server boundaries read private contact data | No browser-owned writes in current app flow; server-owned points/notifications keep using trusted clients | `public.public_profiles` + server-fetched role/identity helpers + service-role boundaries | Authorization MUST use DB role data, never `user_metadata`. `email` stays out of the public projection and remains trusted-only. |
| `public.comentarios_reporte` | Public read for non-deleted comments on visible reports | Trusted server insert/update(delete-soft) only | Trusted comment workflow + notification route + service-role server client | Browser writes were removed from detail flows, so read-only RLS is now safe here. |
| `public.historial_estados` | Public/admin read on visible report history | Trusted server inserts only | Trusted admin/state-change workflow + service-role server client | Insert path now lives behind server-only mutations, so read-only RLS is now safe here. |
| `public.votos_no_existe` | Authenticated user reads own vote existence; aggregate counts for visible reports | Authenticated user inserts at most one own vote | Trusted vote workflow | Requires duplicate-prevention and later atomic points handling. |
| `public.votos_reparado` | Authenticated user reads own vote existence; aggregate counts for visible reports | Authenticated user inserts at most one own vote | Trusted vote workflow | Same rollout notes as `votos_no_existe`. |
| `public.fotos_reporte` | Public read for visible report images | Trusted report creation/image workflow inserts metadata | Server-owned image metadata writes with dual-read compatibility | Canonical reference moves to `{ bucket, path }` while legacy `url` remains readable during backfill. |
| `public.roles` | Read-only lookup for server and presentation role labels | No client writes | Shared authz constants + DB lookup fallback | Prefer constants in app code, keep DB as persisted source. |
| `public.estados` | Read-only lookup for report state labels | No client writes | Shared state constants + DB lookup fallback | Admin transitions must validate against canonical state IDs. |
| `storage.objects` bucket `reportes` | Public object URL reads; avoid broad object listing policies | Authenticated upload only in the current app path | Trusted image workflow + minimal storage policies | Current upload flow uses `upsert: false`, so only `INSERT` is required in this batch. |

## Route trust boundaries in this batch

| Route | Caller | Authorization model | Untrusted payload removed |
|---|---|---|---|
| `POST /api/send-notification` | Authenticated session after comment creation | Session user is resolved server-side; owner email/title/usernames are fetched from DB | `ownerEmail`, `ownerUsername`, `commenterUsername`, `reporteTitulo` |
| `POST /api/send-status-notification` | Authenticated admin session after state transition | Session user + DB-backed admin role check; owner email/title/state label are fetched server-side | `ownerEmail`, `ownerUsername`, `reporteTitulo`, arbitrary state label |

## Rollout notes

1. Keep browser UX unchanged while replacing sensitive writes and side effects with trusted server boundaries.
2. Use server-only clients with `service_role` for trusted mutations; never expose that key to the browser.
3. Only enable table RLS after each corresponding trusted path is live.
4. Keep legacy image URL reads active until canonical `{ bucket, path }` reads and backfill land.
5. Since `reportes` is a public bucket, remove `storage.objects` listing policies before tightening table RLS any further.
