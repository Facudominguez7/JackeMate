# Plantillas de correo de Supabase Auth

Supabase envía por su cuenta los correos de autenticación, así que estas plantillas no se aplican con el deploy: hay que pegarlas en el panel.

Los archivos `.html` se generan desde `lib/notifications/auth-email-templates.ts`, con la misma plantilla base que los correos de la app. No los edites a mano: cambiá el código y regeneralos con:

```bash
npm run email:templates
```

`npm test` falla si los archivos no coinciden con el código.

## Cómo aplicarlas

1. Esperá a que esté desplegada la versión que incluye `/auth/confirm` con `redirect_to` y las imágenes de `public/email/`. Las plantillas dependen de las dos.
2. En Supabase, abrí **Authentication → Emails → Templates**.
3. Para cada plantilla de la tabla, pegá el asunto y reemplazá todo el cuerpo por el contenido del archivo.
4. Guardá y probá con un pedido real (por ejemplo, recuperar la contraseña desde `/auth/recuperar`).

| Plantilla en Supabase | Asunto | Archivo |
|-----------------------|--------|---------|
| Confirm signup | Confirmá tu cuenta de Reporty | `confirmation.html` |
| Reset password | Creá una nueva contraseña para Reporty | `recovery.html` |
| Change email address | Confirmá tu correo en Reporty | `email_change.html` |
| Magic link | Tu enlace para entrar a Reporty | `magic_link.html` |
| Invite user | Te invitaron a Reporty | `invite.html` |
| Reauthentication | Tu código de verificación de Reporty | `reauthentication.html` |

## Cómo funcionan los enlaces

Los enlaces van a `{{ .SiteURL }}/auth/confirm?token_hash=...&type=...&redirect_to={{ .RedirectTo }}` en lugar de `{{ .ConfirmationURL }}`:

- El token se verifica en el servidor, así que el enlace funciona aunque se abra en otro dispositivo o navegador.
- El enlace apunta a `reporty.com.ar` y no a un dominio de `supabase.co`, algo que los filtros de spam miran.
- `/auth/confirm` toma el destino del `next` que trae `redirect_to`. Si el enlace venció, lleva a una página con la explicación.

`{{ .SiteURL }}` es la **Site URL** de Supabase (Authentication → URL Configuration). Tiene que ser `https://reporty.com.ar`.
