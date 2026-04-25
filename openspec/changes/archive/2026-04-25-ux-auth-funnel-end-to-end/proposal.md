# Proposal: UX Auth Funnel End-to-End

## Intent

Resolver la confusión entre reporte como invitado, conversión a cuenta, confirmación de email y acceso a dashboard. El usuario debe entender qué puede hacer ahora, qué queda pendiente y cuál es el próximo CTA sin promesas falsas sobre acceso inmediato.

## Scope

### In Scope
- Narrativa y CTAs consistentes para visitante → anónimo → reporte creado → cuenta pendiente → cuenta confirmada.
- Estado post-reporte/conversión que centralice próximos pasos, reenvío/confirmación de email y alternativas de continuidad.
- Bloqueo accionable de dashboard para anónimos/no confirmados, con explicación y retorno al flujo correcto.
- Mensajes de error/éxito para fallas de sesión anónima, conversión, email y pérdida de contexto.

### Out of Scope
- Reemplazar Supabase Auth o eliminar confirmación de email.
- Cambios de RLS/schema salvo que diseño demuestre necesidad.
- Analítica avanzada de conversión; solo puntos de instrumentación básicos si ya encajan.

## Capabilities

### New Capabilities
- `auth-funnel-continuity`: continuidad UX para reporte invitado, conversión, email pendiente/confirmado y acceso a dashboard.

### Modified Capabilities
- `delivery-verification-guardrails`: sumar smoke manual obligatorio del funnel anónimo→cuenta→dashboard.

## Approach

Mantener creación anónima para baja fricción y agregar una experiencia explícita end-to-end: copy único, CTAs por estado, pantalla/estado post-reporte y dashboard bloqueado con acción clara. La conversión debe tratar email pendiente como estado válido, no como éxito total.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/page.tsx` | Modified | CTA inicial “reportá como invitado”. |
| `app/reportes/nuevo/page.tsx` | Modified | Banner, estados, éxito y redirección post-reporte. |
| `app/reportes/nuevo/actions.ts` | Modified | Errores claros para sesión anónima/reporte. |
| `app/auth/page.tsx` | Modified | `modo=completar-cuenta`, email pendiente y continuidad. |
| `app/auth/actions.ts` | Modified | Conversión anónima, mensajes y redirecciones. |
| `app/dashboard/page.tsx` | Modified | Bloqueo accionable para anónimos/no confirmados. |
| `database/queries/dashboard/get-dashboard-data.ts` | Modified | Mantener anónimos sin datos privados. |
| `utils/supabase/middleware.ts` | Modified | Preservar guards y estados permitidos. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cuenta queda pendiente de email | High | Mensaje/CTA específico y sin prometer dashboard. |
| Pérdida de contexto tras confirmar en otro dispositivo | Med | Fallback a login/dashboard con explicación. |
| Anónimos obtienen permisos indebidos | Med | No cambiar RLS; validar con smoke y helpers existentes. |

## Rollback Plan

Revertir cambios UI/actions/middleware del cambio y volver a redirecciones actuales: reporte creado → `/auth?modo=completar-cuenta`; dashboard mantiene redirección a `/auth`.

## Dependencies

- Supabase Auth anónimo y confirmación de email existentes.
- Sin dependencia nueva prevista.

## Success Criteria

- [ ] Un invitado crea reporte y entiende cómo conservar seguimiento.
- [ ] Conversión muestra email pendiente y permite continuar sin mentir acceso.
- [ ] Dashboard bloqueado ofrece CTA correcto para anónimo/no confirmado.
- [ ] Smoke cubre reporte anónimo, conversión, confirmación, login y dashboard.
