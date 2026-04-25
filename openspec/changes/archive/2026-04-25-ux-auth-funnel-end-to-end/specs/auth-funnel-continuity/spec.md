# Especificación: Continuidad del Funnel de Autenticación

## Propósito
Definir la experiencia end-to-end para los flujos de invitado, usuario anónimo, conversión a cuenta, confirmación de email y acceso al dashboard, asegurando mensajes claros, CTAs accionables y estados intermedios sin ambigüedades.

## Requisitos

### Requisito 1: Reporte como invitado con confirmación clara
**El sistema DEBE permitir crear un reporte como invitado y comunicar explícitamente que el seguimiento completo requiere cuenta verificada.**

#### Escenario 1.1: Envío exitoso de reporte como invitado
- **DADO** un visitante en `/reportes/nuevo` sin sesión previa
- **CUANDO** completa el formulario y confirma el envío
- **ENTONCES** el sistema crea el reporte correctamente
- **Y** muestra un mensaje de éxito orientado a conversión (completar cuenta)

#### Escenario 1.2: Mensaje de confirmación adaptado a usuario anónimo
- **DADO** un usuario con sesión anónima activa
- **CUANDO** se abre el diálogo final de confirmación
- **ENTONCES** el texto NO promete beneficios reservados a cuenta completa (por ejemplo, dashboard inmediato)
- **Y** explica que para seguimiento/notificaciones/votos debe completar cuenta

#### Escenario 1.3: Error de creación de reporte en modo invitado
- **DADO** un usuario invitado intentando enviar un reporte
- **CUANDO** ocurre un error de backend
- **ENTONCES** el sistema muestra un mensaje de error entendible
- **Y** permite reintentar sin perder el contenido del formulario

### Requisito 2: Conversión anónimo → cuenta con estado pendiente
**El sistema DEBE convertir la sesión anónima a cuenta permanente usando el mismo `user.id` y DEBE informar cuando la cuenta queda pendiente de verificación por email.**

#### Escenario 2.1: Conversión iniciada desde flujo post-reporte
- **DADO** un usuario anónimo que acaba de crear un reporte
- **CUANDO** accede a `/auth?modo=completar-cuenta` y envía email+contraseña
- **ENTONCES** el sistema inicia la conversión de identidad
- **Y** mantiene continuidad del historial del mismo usuario

#### Escenario 2.2: Conversión con confirmación de email pendiente
- **DADO** que la confirmación de email está habilitada en Supabase
- **CUANDO** el usuario completa el formulario de conversión
- **ENTONCES** el sistema informa que la cuenta quedó pendiente de confirmación
- **Y** NO comunica falsamente que ya tiene acceso pleno al dashboard

#### Escenario 2.3: Error al convertir cuenta anónima
- **DADO** un usuario anónimo en proceso de conversión
- **CUANDO** falla la actualización de identidad (email/password)
- **ENTONCES** el sistema muestra un mensaje de error accionable
- **Y** conserva una ruta clara para reintentar

### Requisito 3: Cuenta confirmada y acceso al dashboard
**El sistema DEBE habilitar el dashboard cuando la cuenta ya no es anónima y su estado de verificación permite acceso.**

#### Escenario 3.1: Acceso exitoso tras confirmación
- **DADO** un usuario que confirmó su email
- **CUANDO** navega a `/dashboard`
- **ENTONCES** visualiza su panel según su rol
- **Y** puede acceder a seguimiento de reportes

#### Escenario 3.2: Continuidad de historial post-conversión
- **DADO** un reporte creado en estado anónimo
- **CUANDO** el usuario completa y confirma su cuenta
- **ENTONCES** mantiene visibilidad de su historial vinculado al mismo `user.id`

#### Escenario 3.3: Reingreso desde dispositivo nuevo
- **DADO** un usuario que confirmó cuenta en otro dispositivo
- **CUANDO** inicia sesión con email+contraseña en este dispositivo
- **ENTONCES** el sistema lo reconoce como cuenta permanente
- **Y** permite acceso normal al dashboard

### Requisito 4: Bloqueos accionables para anónimo/no confirmado
**El sistema DEBE bloquear acceso al dashboard para estados no habilitados y DEBE mostrar CTAs concretos para resolver el bloqueo.**

#### Escenario 4.1: Usuario anónimo intenta abrir dashboard
- **DADO** una sesión anónima activa
- **CUANDO** el usuario entra a `/dashboard`
- **ENTONCES** el sistema bloquea acceso
- **Y** redirige/muestra flujo de completar cuenta con explicación clara

#### Escenario 4.2: Usuario con verificación pendiente intenta abrir dashboard
- **DADO** un usuario con email pendiente de confirmación
- **CUANDO** intenta acceder al dashboard
- **ENTONCES** el sistema bloquea acceso
- **Y** muestra CTA para confirmar correo (o reenviar) antes de continuar

#### Escenario 4.3: Navegación coherente desde header y menús
- **DADO** un usuario en estado anónimo o pendiente
- **CUANDO** usa enlaces de “Mi dashboard”
- **ENTONCES** el sistema no deja en estado ambiguo
- **Y** lo conduce al siguiente paso correcto del funnel

### Requisito 5: Manejo de errores y fallbacks del funnel
**El sistema DEBE manejar errores de sesión, configuración y contexto con mensajes no técnicos para el usuario y acciones de recuperación.**

#### Escenario 5.1: Login anónimo deshabilitado en proveedor
- **DADO** que Supabase tiene anónimo deshabilitado
- **CUANDO** el visitante intenta crear sesión anónima
- **ENTONCES** el sistema muestra mensaje claro en español
- **Y** oculta CTA inválida de “Continuar sin cuenta”

#### Escenario 5.2: Sesión faltante al cargar formulario
- **DADO** una carga inicial sin sesión persistida
- **CUANDO** `getUser()` devuelve sesión ausente
- **ENTONCES** el sistema intenta crear sesión anónima
- **Y** evita tratar ese estado esperado como error fatal

#### Escenario 5.3: Pérdida de contexto entre pasos del funnel
- **DADO** un usuario que abandona y retoma el flujo luego
- **CUANDO** vuelve desde una ruta intermedia (`/auth`, `/dashboard`, `/reportes/nuevo`)
- **ENTONCES** el sistema comunica su estado actual (invitado, pendiente, confirmado)
- **Y** ofrece CTA de continuidad sin contradicciones
