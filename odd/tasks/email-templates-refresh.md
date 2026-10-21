# Email templates refresh

Objective: every email Reporty sends (app notifications through Resend and Supabase Auth emails) uses the refreshed civic style.
Branch: `feat/email-templates-refresh` · Delivery: ask-on-risk · Test runner: Vitest (`npx vitest run`).

## Specs

- **S1** Review every current email template and make it use the new style: "hay que verificar todas las plantillas de correo actuales para utilizar el nuevo estilo".
  - App emails in `lib/notifications/report-notifications.ts`: new comment, status change and crew assignment (crews stay parked behind `CUADRILLAS_ENABLED`, but the template keeps the same style).
  - Supabase Auth emails: signup confirmation, password recovery, email change, magic link, invite and reauthentication.
  - The new style comes from `app/globals.css` (tokens converted to hex for email clients) and the logo in `public/logos/`.
- **S2** The Supabase Auth emails are in Spanish, say "Reporty", and their links point to `reporty.com.ar` (through `/auth/confirm` with `token_hash`) instead of `supabase.co`, so they work across devices and look less like phishing. Assumption: agreed earlier in the session as the fix for recovery links opened on another device.
- **S3** `/auth/confirm` must not end on a 404 when a link is expired or reused (today it redirects to `/error`, which does not exist), and it must keep sending the user to the page the original flow requested.
- **S4** The Supabase templates are stored in the repo so they can be pasted into the dashboard (Authentication → Emails); the MCP cannot change auth settings.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1 | inline | pending | |
| T2 | S2, S3 | inline | pending | |
| T3 | S1, S2, S4 | inline | pending | |

- T1: shared email layout with the new style; the three app emails use it; tests.
- T2: `/auth/confirm` resolves the destination from `next` or `redirect_to` and redirects expired links to existing pages; `/auth` explains an expired link; tests.
- T3: Supabase Auth templates generated from the same layout into `supabase/templates/`, plus paste instructions.

Route evidence: no Writer trigger reason (no parallel units with disjoint heavy surfaces, context below the backstop), so every task is inline.
Forecast: ~450 authored changed lines (generated HTML excluded); ask for the chain strategy before the commit that crosses ~400.

## Log

- **L1** (2026-10-21) User: "hay que verificar todas las plantillas de correo actuales para utilizar el nuevo estilo"
- **L2** Context: Supabase now sends through Resend (`no-reply@notificaciones.reporty.com.ar`, domain verified). The first recovery emails were delivered but landed in spam: new sender, short English default template, and a link to `supabase.co`.
- **L3** Theme tokens in hex: background `#eeecec`, foreground `#15140f`, primary `#278c5a`, muted foreground `#495a4f`, accent `#d8eee0`, accent foreground `#163524`, destructive `#cc3d3d`, border `#bababa`, info `#297cae`; radius 12px, pill buttons, black secondary.
