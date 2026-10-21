# Email templates refresh

Objective: every email Reporty sends (app notifications through Resend and Supabase Auth emails) uses the refreshed civic style.
Branch: `feat/email-templates-refresh` · Delivery: ask-on-risk → stacked-to-main (T1 → T2 → T3) · Test runner: Vitest (`npx vitest run`).

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
| T1 | S1 | inline | done | PR #124 (b55b6a5, b258600, e3331ea); RED → GREEN, suite 53, Chrome 3 sizes, MailHog preview |
| T2 | S2, S3 | inline | done | branch fix/auth-confirm-links; RED 6 → GREEN, suite 61, Chrome 3 sizes |
| T3 | S1, S2, S4 | inline | done | branch feat/auth-email-templates; RED → GREEN 19, suite 81, MailHog 6 templates × 3 sizes |

- T1: shared email layout with the new style; the three app emails use it; tests.
- T2: `/auth/confirm` resolves the destination from `next` or `redirect_to` and redirects expired links to existing pages; `/auth` explains an expired link; tests.
- T3: Supabase Auth templates generated from the same layout into `supabase/templates/`, plus paste instructions.

Route evidence: no Writer trigger reason (no parallel units with disjoint heavy surfaces, context below the backstop), so every task is inline.
Forecast: ~450 authored changed lines (generated HTML excluded); ask for the chain strategy before the commit that crosses ~400.

## Log

- **L1** (2026-10-21) User: "hay que verificar todas las plantillas de correo actuales para utilizar el nuevo estilo"
- **L2** Context: Supabase now sends through Resend (`no-reply@notificaciones.reporty.com.ar`, domain verified). The first recovery emails were delivered but landed in spam: new sender, short English default template, and a link to `supabase.co`.
- **L3** Theme tokens in hex: background `#eeecec`, foreground `#15140f`, primary `#278c5a`, muted foreground `#495a4f`, accent `#d8eee0`, accent foreground `#163524`, destructive `#cc3d3d`, border `#bababa`, info `#297cae`; radius 12px, pill buttons, black secondary.
- **L4** (2026-10-21) User chose "PRs encadenados a main". T1 ≈570 changed lines, over half deleted legacy inline HTML; flag `size:exception` in its PR instead of an artificial split. RDD assess on b55b6a5: medium, review_due false (under_budget).
- **L5** (2026-10-21) User: "pero antes usa mailhog para que pueda ver como quedaron los estilos". MailHog already runs in Docker (`mailhog`, SMTP 1025, UI 8025); the four app emails were rendered and sent there with HTML and plain-text parts.
- **L6** (2026-10-21) User asked to apply the `<frontend_aesthetics>` guidelines (added to the local, gitignored AGENTS.md, which CLAUDE.md imports). Redesign: "postcard from Posadas" — coastal map header (`public/email/posadas-mapa.jpg`, 11 KB, cropped from the app backdrop with a baked fade), trimmed logo in a white map-label pill (`public/email/reporty-logo.png`), Geist + Geist Mono from Google Fonts (mono kickers and "Reporte N.º" eyebrows), report as a numbered file card, black pill CTA with a green arrow, staggered reveal only under `prefers-reduced-motion: no-preference`. Assets are served from the app URL, so they go live with the deploy.
- **L7** (2026-10-21) User approved the stub design ("me cierra asi si"). PR #124 opened for T1 (RDD assess: medium, not due, under_budget).
- **L8** T2: `/auth/confirm` takes `next`, or the `next` inside Supabase's `redirect_to`, recovery defaults to `/auth/nueva-contrasena`, expired links go to `/auth/recuperar?error=enlace` or `/auth?error=enlace&next=...` (new alert on `/auth`). Follow-up for T3: the "abrilo desde este mismo navegador" copy in the recovery and guest-link messages stays until the token_hash templates are live in Supabase.
- **L9** (2026-10-21) T3: `lib/notifications/auth-email-templates.ts` renders the six Supabase Auth emails (confirmation, recovery, email_change, magic_link, invite, reauthentication) with the shared layout and Spanish subjects. Links use `{{ .SiteURL }}/auth/confirm?token_hash=...&type=...&redirect_to={{ .RedirectTo }}` (cross-device, no supabase.co link); assets load from `{{ .SiteURL }}`. Files are generated into `supabase/templates/` with `npm run email:templates`; the test fails when they drift. `supabase/templates/README.md` holds the subjects and paste steps. MailHog preview: 6 emails, no horizontal scroll at 1920×1080, 1280×720, 390×844, logo loads. Pending after deploy: the user pastes the templates in Supabase (Authentication → Emails), then the "abrilo desde este mismo navegador" copy can go.
- **L10** (2026-10-21) The user pasted the six templates in Supabase. Recovery works end to end. The signup test with the name `<b>Prueba</b>` rendered the greeting "en negrita": Supabase does not escape template variables, so an attacker could sign up with someone else's email and inject HTML into an email sent from our domain. Fix: the greeting uses `{{ .Data.name | html }}`. Test added. Go `text/template` and `html/template` both render `&lt;b&gt;Prueba&lt;/b&gt;` once. The user must re-paste all six templates.
