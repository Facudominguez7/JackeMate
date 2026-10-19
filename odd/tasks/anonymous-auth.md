# Feature: anonymous-auth

Objective: let citizens report incidents without registering (Supabase Anonymous Sign-Ins), return from the same browser to see their reports, and optionally link an email.
Branch: `feat/anonymous-auth` (from `main`). Delivery: `ask-on-risk`. Test runner: none in repo (no `test` script) — checks are `pnpm lint`, `tsc --noEmit`, `pnpm build`, plus SQL probes against the live project inside rolled-back transactions.

## Specs

- S1 Session creation point. "No crear usuarios anónimos automáticamente al visitar la página principal." The session is created only inside `crearReporteAction`, after input/image validation passes and only when `auth.getUser()` returns no user ("Reutilizar una sesión existente, sea anónima o permanente."). "Evitar crear múltiples usuarios por clics repetidos o llamadas concurrentes." "No redirigir a `/auth` cuando un invitado quiere crear una incidencia."
- S2 Profiles. "Los reportes anónimos deben quedar asociados al UUID real de `auth.users`." Anonymous profiles get a dedicated `invitado` role (id 5), never `ciudadano`; conversion promotes `invitado` → `ciudadano`. "No inventar emails para usuarios anónimos." "No otorgar privilegios de administrador, operador o interesado."
- S3 Authorization. Distinguish via `user.is_anonymous` / JWT `is_anonymous`. Guest: view, create reports, attach photos, see own reports = Sí; points, ranking, comment, vote, admin = No. RLS restrictive policies for anonymous on direct vote inserts and storage uploads. "Auditar también los triggers o RPC de puntos, para garantizar que una identidad anónima no acumule puntos indirectamente."
- S4 "Mis reportes": Server Component, own reports only (title, category, photo, date, state, link to detail), info state without session, never creates an identity.
- S5 Email linking via `updateUser({ email })` (not `signUp()`), verification required, UUID preserved, email-exists case handled without merging. Passwordless OTP/magic-link login on `/auth` for converted accounts.
- S6 Abuse: optional Cloudflare Turnstile (Supabase Auth CAPTCHA), report rate limit by actor and hashed IP (not UUID only), duplicate submission guard, bucket size/MIME limits, guests blocked from notification route.
- S7 UX: confirmation with link to "Mis reportes"; guest banner verbatim: "Estás usando JackeMate como invitado. Tus reportes están vinculados a este navegador. Si eliminás los datos del sitio, podrías perder el acceso. Vinculá tu correo para conservar tu cuenta."
- S8 Incremental, non-destructive migration in `supabase/migrations`; docs updated (`access-matrix.md`, README).

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | S2 S3 S6 S8 | inline | done | migration applied; rolled-back probes P1–P7 + RLS probes pass |
| T2 | S1 S3 S6 | inline | done | E2E via HTTP server action: T0–T7 pass |
| T3 | S4 S5 S7 | inline | done | /mis-reportes, link email, magic link, guest form |
| T4 | all | delegated verifier | pending | tsc 0 errors, lint 0 errors, build OK |

## Log

- L1 (2026-10-19) User: "no esta desplegado en vercel, hace una rama desde main para esto" + full prompt "Implementar autenticación anónima con Supabase Auth en JackeMate" (sections 1–12), ending "Definí el punto exacto de creación de sesiónSepará requisitos obligatorios de opcionales".
- L2 Audit: 8 anonymous users already exist (2026-04-25), created in pairs (double-creation), all with `rol_id = 2`, two with points (15, 11). `on_auth_user_profile_sync` inserts profiles with default role 2. `votos_*_owner_insert` and `reportes_authenticated_upload` accept any `authenticated` JWT, anonymous included. Bucket `reportes` has no size/MIME limit.
- L3 Session creation point decided: inside `crearReporteAction`, after zod + image validation, only when `getUser()` is empty; client adds a synchronous submit lock + idempotency `submissionId`.
- L4 E2E (prod build on :3100, live DB): visiting `/mapa`, `/reportes/nuevo`, `/mis-reportes` sets no auth cookie; invalid payload creates no session; first valid submit creates exactly one anonymous user (cookie ~400 days), report #36 with photo, role 5, 0 points; resubmit same id -> "duplicate"; second submit reuses same UUID (#37); `/mis-reportes` shows both + exact banner; other browser sees info state; guest comment/vote rejected; guest cannot delete report #1; test reports soft-deleted by the guest action, storage objects removed.
- L5 Found and fixed: middleware detail regex also matched `/reportes/nuevo`, still redirecting guests to `/auth`.
- L6 Not E2E-tested: email linking and magic link (need a real inbox); concurrent cookieless submissions can still mint two guests server-side (client lock prevents it in the UI).
