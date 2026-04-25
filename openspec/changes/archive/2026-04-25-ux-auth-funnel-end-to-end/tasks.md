# Tasks: UX Auth Funnel End-to-End

## Phase 1: Foundation — Tipos y guard de middleware

- [x] 1.1 `utils/supabase/middleware.ts`: agregar bloque `if (isAnonymousUser(user) && isProtected)` que redirija a `/auth?modo=completar-cuenta` **antes** del bloque existente `!user && isProtected`
- [x] 1.2 `app/auth/actions.ts`: agregar campo `email?: string` a `AuthFormState`; en `signup()`, retornar `{ message, email: data.email }` en los dos casos donde queda email pendiente (conversión anónima y signup normal)

## Phase 2: Server Action — Reenvío de email

- [x] 2.1 `app/auth/actions.ts`: agregar `export async function reenviarEmailConfirmacion(email: string): Promise<AuthFormState>` que llame `supabase.auth.resend({ type: 'signup', email })` y retorne `{ message }` en éxito o `{ error }` en fallo

## Phase 3: UI — Pantallas del funnel

- [x] 3.1 `app/auth/page.tsx`: agregar `useActionState(reenviarEmailConfirmacion, initialState)` y estado `resendState`; mostrar formulario de reenvío con input hidden `email` (`signupState.email`) solo cuando `signupState.message && esModoCompletarCuenta`
- [x] 3.2 `app/auth/page.tsx`: reemplazar copy del Alert de `signupState.message` en modo `completar-cuenta` — nuevo texto: "Tu cuenta quedó pendiente de confirmación. Hasta confirmar el enlace, tu sesión sigue como invitado y no podés acceder al dashboard."
- [x] 3.3 `app/page.tsx`: agregar `user` al state del `useEffect` (`setUser(user)`); en bloque `readOnly`, mostrar botón primario "Reportar sin cuenta" (→ `/reportes/nuevo`) cuando `!user && !loading`, reemplazando el copy ambiguo actual
- [x] 3.4 `app/dashboard/page.tsx`: cambiar redirect de `if (!data.user)` de `/auth` a `/auth?modo=completar-cuenta` como defensa secundaria (middleware ya lo cubre)

## Phase 4: Smoke manual

- [ ] 4.1 Req 4.1: con sesión anónima activa, navegar a `/dashboard` → verificar redirect a `/auth?modo=completar-cuenta`
- [ ] 4.2 Req 2.2: en modo `completar-cuenta`, enviar formulario con email confirmation habilitado → verificar mensaje sin prometer dashboard + botón "Reenviar correo" visible y funcional
- [ ] 4.3 Req 1.1: crear reporte como invitado → toast correcto → redirect a `completar-cuenta` → historial del mismo `user.id` preservado
- [ ] 4.4 Req 4.3: home sin sesión → verificar que aparece CTA "Reportar sin cuenta"
- [ ] 4.5 Regresión: login normal y registro sin `modo=completar-cuenta` funcionan sin cambios de comportamiento
