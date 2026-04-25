# Design: UX Auth Funnel End-to-End

## Technical Approach

Parches UI/lógica focalizados en 5 archivos existentes: mejorar CTA de home para visitantes, actualizar estado email-pendiente en auth con opción de reenvío, redirigir el guard de `/dashboard` de forma contextual desde el middleware. Sin cambios de schema ni RLS. `isAnonymousUser()` sigue siendo la única fuente de verdad para detectar estado de sesión.

## Architecture Decisions

| Decisión | Opción elegida | Alternativas | Rationale |
|----------|---------------|--------------|-----------|
| Estado "email pendiente" | `isAnonymousUser()` como único check — no flag nuevo | Cookie `email_pending`, leer `email_confirmed_at` | `updateUser` con confirmación mantiene al usuario como anónimo hasta confirmar. Un solo helper, cero estado nuevo |
| Guard `/dashboard` para anónimo | Middleware redirige a `/auth?modo=completar-cuenta` | Manejar en `dashboard/page.tsx` | Middleware ya es la capa de guardas; evita ejecutar `getDashboardPageData` para usuarios que no pueden ver el dashboard |
| Reenvío de email | Nueva server action `reenviarEmailConfirmacion(email)` | API route, Supabase client-side | Consistente con el patrón de actions existente. Reutiliza `server.ts` client |
| Home page CTA visitante | Agregar `user` al state local, mostrar "Reportar sin cuenta" | Refactorizar a Server Component | La página ya es client component con fetch de datos. Agregar un estado es mínimo |

## Data Flow

```
Visitante → /reportes/nuevo
  → signInAnonymously() [client]
  → crearReporteAction() [server action]
  → redirect → /auth?modo=completar-cuenta

/auth?modo=completar-cuenta
  → signup() server action → updateUser(email, password)
  → isAnonymousUser(updatedUser) === true → return { message }
  → UI muestra estado pendiente (sin prometer dashboard)
  → [botón] reenviarEmailConfirmacion(email) server action

Usuario confirma email (enlace en correo)
  → sesión upgradea: anónima → permanente
  → navega a /dashboard

Middleware en /dashboard:
  isAnonymousUser(user) → redirect /auth?modo=completar-cuenta
  !user              → redirect /auth
  user válido        → pasa a dashboard/page.tsx
```

## File Changes

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `utils/supabase/middleware.ts` | Modify | Agregar guard: anónimo en `/dashboard` → redirect `/auth?modo=completar-cuenta` |
| `app/page.tsx` | Modify | Agregar `user` al state; mostrar CTA "Reportar sin cuenta" para visitantes sin sesión |
| `app/auth/page.tsx` | Modify | Mejorar mensaje email-pendiente en modo `completar-cuenta`; agregar botón resend con feedback |
| `app/auth/actions.ts` | Modify | Nueva action `reenviarEmailConfirmacion(email)` |
| `app/dashboard/page.tsx` | Modify | Redirect fallback: anónimo → `/auth?modo=completar-cuenta` (ya cubierto por middleware, esto es defensa secundaria) |

No cambian: `app/reportes/nuevo/page.tsx`, `app/reportes/nuevo/actions.ts` (ya implementados correctamente per spec), `database/queries/dashboard/get-dashboard-data.ts`.

## Interfaces / Contracts

```typescript
// app/auth/actions.ts — nueva action
export async function reenviarEmailConfirmacion(
  email: string
): Promise<AuthFormState>
// Llama: supabase.auth.resend({ type: 'signup', email })
// Retorna: { message } en éxito, { error } en fallo

// utils/supabase/middleware.ts — lógica nueva (antes del guard existente)
if (isAnonymousUser(user) && isProtected) {
  url.pathname = '/auth'
  url.searchParams.set('modo', 'completar-cuenta')
  return NextResponse.redirect(url)
}

// app/auth/page.tsx — estado email-pendiente en modo completar-cuenta
// signupState.message + esModoCompletarCuenta → Alert con copy específico:
// "Tu cuenta quedó pendiente de confirmación. Revisá tu bandeja.
//  Hasta confirmar el enlace, tu sesión sigue como invitado."
// + botón "Reenviar correo" → llama reenviarEmailConfirmacion(email)
```

## Testing Strategy

| Capa | Qué testear | Approach |
|------|------------|----------|
| Smoke manual | Anónimo → `/dashboard` → redirige a `completar-cuenta` | Navegar con sesión anónima activa |
| Smoke manual | Conversión → mensaje email-pendiente, sin prometer dashboard | Completar formulario con email confirmation habilitado |
| Smoke manual | Reenvío de email → feedback de éxito/error | Click en "Reenviar correo" en estado pendiente |
| Smoke manual | Funnel completo: visitar → crear → completar → confirmar → dashboard | Checklist end-to-end |
| Regresión | Login existente y registro normal no se rompen | Probar tabs de login y register sin `modo=completar-cuenta` |

## Migration / Rollout

Sin migración de datos. Todos los cambios son capa UI/actions. Para revertir: restaurar guards de middleware y textos previos de redirección.

## Open Questions

Ninguna — diseño completo basado en análisis del código actual.
