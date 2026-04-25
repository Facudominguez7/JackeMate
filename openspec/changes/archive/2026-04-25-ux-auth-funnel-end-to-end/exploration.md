## Exploration: ux-auth-funnel-end-to-end

### Current State
El funnel actual mezcla tres caminos: usuario sin sesión, usuario anónimo y usuario permanente. Desde home, el CTA para visitante dice que puede iniciar la carga y que “si hace falta” se pedirá cuenta; en la práctica `/reportes/nuevo` intenta crear una sesión anónima automáticamente, permite crear el reporte y recién después empuja a `/auth?modo=completar-cuenta`. La fricción principal de conversión está en que el usuario puede terminar el reporte, pero la explicación de qué gana/perdería al completar cuenta aparece repartida entre banner, diálogo, toast y página de auth.

El registro permanente usa Supabase Auth con confirmación de correo: si `signUp` no devuelve sesión, la UI muestra un mensaje para revisar email. Para usuarios anónimos, `signup` llama `updateUser` con email, password y metadata; según la documentación actual de Supabase, convertir un usuario anónimo requiere linkear identidad y el password queda condicionado por verificación del email, por lo que este tramo necesita especificarse con cuidado para evitar un estado “cuenta a medias”. El dashboard trata usuarios anónimos como no autenticados y redirige a `/auth`, de modo que un usuario invitado con reporte creado no puede usar el dashboard hasta confirmar/completar la cuenta.

Los estados intermedios existen pero son incompletos: carga inicial “Preparando formulario...”, optimización de imagen, envío, toast posterior y alerta de verificación de correo. Falta una narrativa end-to-end consistente para “reporte creado como invitado → completá cuenta → verificá correo → volvé a seguimiento/dashboard”, y faltan CTAs explícitos para reenviar/confirmar email, continuar al mapa/reportes o entender por qué el dashboard está bloqueado.

### Affected Areas
- `app/page.tsx` — CTA inicial para visitantes y copy de conversión hacia creación rápida/anónima.
- `app/reportes/nuevo/page.tsx` — inicio automático de sesión anónima, banner de invitado, validaciones, confirmación, toast y redirección a completar cuenta.
- `app/reportes/nuevo/actions.ts` — creación de reportes con sesión anónima, perfil base y mensajes de error del backend.
- `app/auth/page.tsx` — tabs login/registro, modo `completar-cuenta`, mensajes de email confirm y continuidad después del reporte.
- `app/auth/actions.ts` — login, signup, conversión de usuario anónimo, confirmación de correo y redirecciones.
- `app/dashboard/page.tsx` — estado de usuario anónimo/no confirmado y CTA cuando no puede acceder al panel.
- `database/queries/dashboard/get-dashboard-data.ts` — mapea usuarios anónimos a `user: null`, condicionando la experiencia del dashboard.
- `utils/supabase/middleware.ts` — protege `/dashboard`, permite `/reportes/nuevo` público y deja pasar usuarios anónimos.
- `lib/authz/anonymous.ts` — detección compartida de usuario anónimo por claims de Supabase.
- `supabase/migrations/20260425193000_auth_users_profiles_sync_trigger.sql` — sincroniza perfiles para usuarios auth, incluyendo anónimos; relevante para continuidad del reporte.

### Approaches
1. **Pulir funnel existente sin cambiar arquitectura** — Mantener sesión anónima automática y mejorar copy/CTAs/estados: home promete “reportá como invitado”, creación explica beneficios, auth guía confirmación y dashboard muestra bloqueo accionable.
   - Pros: Menor riesgo, aprovecha el flujo ya implementado, no exige migraciones ni cambios profundos en Supabase.
   - Cons: Sigue dependiendo de `updateUser` y confirmación email; requiere buena UX para evitar confusión en estados pendientes.
   - Effort: Medium

2. **Embudo explícito con landing intermedia de post-reporte** — Después de crear como invitado, enviar a una pantalla dedicada de éxito/conversión que centralice “guardar seguimiento”, email confirm, próximos pasos y alternativas.
   - Pros: Mejor conversión medible, reduce mensajes dispersos, permite instrumentar abandonos entre reporte creado y cuenta completada.
   - Cons: Nueva ruta/estado de éxito; hay que decidir cómo recuperar el reporte recién creado y cómo manejar refresh/cambio de dispositivo.
   - Effort: Medium

3. **Forzar autenticación antes de crear reportes** — Revertir el anónimo y pedir login/registro antes del formulario.
   - Pros: Menos complejidad de conversión, dashboard/email quedan lineales.
   - Cons: Sube la fricción inicial y contradice el objetivo de reporte rápido; pierde valor del flujo anónimo ya construido.
   - Effort: Low técnicamente, High en impacto UX

### Recommendation
Recomiendo avanzar con un híbrido entre los enfoques 1 y 2: conservar la creación anónima para bajar fricción, pero diseñar un funnel end-to-end explícito con mensajes consistentes y una experiencia post-reporte/confirmación que explique estados y próximos pasos. La propuesta debería definir eventos y estados: visitante, anónimo preparando reporte, reporte enviado, cuenta pendiente de email, cuenta confirmada, dashboard habilitado y fallback cuando email/anonymous sign-in falla.

### Risks
- La conversión anónima con Supabase puede quedar en estado pendiente de verificación; si se promete acceso inmediato al dashboard, la UX miente.
- Los usuarios anónimos usan rol Postgres `authenticated`; cualquier cambio de permisos/RLS debe distinguir `is_anonymous` para no abrir capacidades no deseadas.
- El dashboard actualmente transforma anónimo en `user: null`, por lo que cualquier CTA de “seguir estado” debe contemplar que no habrá acceso hasta completar/verificar cuenta.
- El flujo puede perder contexto si el usuario confirma email en otro dispositivo, limpia cookies o abandona antes de completar cuenta.
- Los mensajes actuales mezclan español neutro y rioplatense; conviene unificar tono antes de tocar muchas pantallas.

### Ready for Proposal
Yes — el próximo paso es crear la propuesta del cambio definiendo alcance UX: copy/CTA, estados intermedios, comportamiento de email confirm, tratamiento de dashboard bloqueado y criterio de éxito de conversión anónimo → cuenta permanente.
