/**
 * Supabase Auth email templates rendered with the shared Reporty layout. Supabase sends these
 * emails itself, so the HTML is generated into `supabase/templates/` and pasted into the
 * dashboard (Authentication → Emails); see `supabase/templates/README.md`.
 *
 * Values in `{{ }}` are Go template variables that Supabase fills when sending. Links go to
 * `/auth/confirm` on the site with a `token_hash` instead of `{{ .ConfirmationURL }}`: they
 * work on any device and do not point to a supabase.co domain. `redirect_to` goes last because
 * `/auth/confirm` reads the destination from the `next` inside it.
 */

import { emailButton, emailCode, emailLinkFallback, emailParagraph, renderEmailLayout } from "./email-layout"

const SITE_URL = "{{ .SiteURL }}"
const GREETING = "{{ if .Data.name }}¡Hola, {{ .Data.name }}!{{ else }}¡Hola!{{ end }}"
const NOT_REQUESTED = "Si no pediste este correo, podés ignorarlo."

/** `type` is the Supabase email OTP type that `/auth/confirm` passes to `verifyOtp`. */
const confirmUrl = (type: string) =>
  `${SITE_URL}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&redirect_to={{ .RedirectTo }}`

type LinkTemplate = {
  file: string
  subject: string
  type: string
  kicker: string
  preheader: string
  paragraphs: string[]
  action: string
  footnote: string
}

const LINK_TEMPLATES: LinkTemplate[] = [
  {
    file: "confirmation.html",
    subject: "Confirmá tu cuenta de Reporty",
    type: "email",
    kicker: "Confirmar cuenta",
    preheader: "Confirmá tu correo para empezar a reportar en Reporty.",
    paragraphs: [
      "Gracias por sumarte a Reporty. Confirmá tu correo para empezar a reportar y seguir los problemas de tu barrio.",
    ],
    action: "Confirmar mi cuenta",
    footnote: NOT_REQUESTED,
  },
  {
    file: "recovery.html",
    subject: "Creá una nueva contraseña para Reporty",
    type: "recovery",
    kicker: "Recuperar contraseña",
    preheader: "Elegí una nueva contraseña para tu cuenta de Reporty.",
    paragraphs: ["Recibimos un pedido para crear una nueva contraseña para {{ .Email }}."],
    action: "Crear nueva contraseña",
    footnote: "Si no lo pediste, ignorá este correo: tu contraseña no cambia.",
  },
  {
    file: "email_change.html",
    subject: "Confirmá tu correo en Reporty",
    type: "email_change",
    kicker: "Confirmar correo",
    preheader: "Confirmá tu correo para guardar tu cuenta de Reporty.",
    paragraphs: ["Confirmá que {{ .NewEmail }} es tu correo para guardar tu cuenta de Reporty."],
    action: "Confirmar mi correo",
    footnote: NOT_REQUESTED,
  },
  {
    file: "magic_link.html",
    subject: "Tu enlace para entrar a Reporty",
    type: "email",
    kicker: "Ingresar",
    preheader: "Tu enlace para entrar a Reporty.",
    paragraphs: ["Usá este enlace para entrar a tu cuenta de Reporty. Sirve una sola vez."],
    action: "Entrar a Reporty",
    footnote: NOT_REQUESTED,
  },
  {
    file: "invite.html",
    subject: "Te invitaron a Reporty",
    type: "invite",
    kicker: "Invitación",
    preheader: "Te invitaron a sumarte a Reporty.",
    paragraphs: ["Te invitaron a sumarte a Reporty, la plataforma para reportar problemas urbanos de Posadas."],
    action: "Aceptar invitación",
    footnote: NOT_REQUESTED,
  },
]

export type AuthEmailTemplate = { file: string; subject: string; html: string }

function renderLinkTemplate({ file, subject, type, kicker, preheader, paragraphs, action, footnote }: LinkTemplate) {
  const url = confirmUrl(type)
  return {
    file,
    subject,
    html: renderEmailLayout({
      assetBaseUrl: SITE_URL,
      title: subject,
      kicker,
      preheader,
      heading: GREETING,
      body: [
        ...paragraphs.map((paragraph) => emailParagraph(paragraph)),
        emailButton(action, url),
        emailLinkFallback(url),
      ].join("\n"),
      footnote,
    }),
  }
}

const REAUTHENTICATION: AuthEmailTemplate = {
  file: "reauthentication.html",
  subject: "Tu código de verificación de Reporty",
  html: renderEmailLayout({
    assetBaseUrl: SITE_URL,
    title: "Tu código de verificación de Reporty",
    kicker: "Verificación",
    preheader: "Tu código para confirmar el cambio en Reporty.",
    heading: GREETING,
    body: [
      emailParagraph("Usá este código para confirmar el cambio en tu cuenta de Reporty."),
      emailCode("Código de verificación", "{{ .Token }}"),
    ].join("\n"),
    footnote: NOT_REQUESTED,
  }),
}

/** Every Supabase Auth email, in the order the dashboard lists them. */
export const AUTH_EMAIL_TEMPLATES: AuthEmailTemplate[] = [...LINK_TEMPLATES.map(renderLinkTemplate), REAUTHENTICATION]
