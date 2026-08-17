export const ROLE_IDS = {
  ADMIN: 1,
  CIUDADANO: 2,
  INTERESADO: 3,
  OPERADOR: 4,
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export const REPORT_STATE_IDS = {
  PENDIENTE: 1,
  REPARADO: 2,
  RECHAZADO: 3,
} as const;

export type ReportStateId =
  (typeof REPORT_STATE_IDS)[keyof typeof REPORT_STATE_IDS];

export const REPORT_BUCKET = "reportes" as const;

export const REPORT_CREATOR_ROLE_IDS = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.CIUDADANO,
] as const;

export const DASHBOARD_ROLE_IDS = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.INTERESADO,
  ROLE_IDS.OPERADOR,
] as const;

export const ADMIN_REPORT_STATE_IDS = [
  REPORT_STATE_IDS.REPARADO,
  REPORT_STATE_IDS.RECHAZADO,
] as const;

/** Roles habilitados para administrar el catálogo de cuadrillas (alta, edición, activación). */
export const CREW_MANAGEMENT_ROLE_IDS = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.OPERADOR,
] as const;

/** Roles habilitados para operar cuadrillas: asignar reportes, registrar observaciones y cerrar intervenciones. */
export const CREW_OPERATION_ROLE_IDS = [
  ROLE_IDS.ADMIN,
  ROLE_IDS.OPERADOR,
] as const;

/** Estados operativos de una asignación de cuadrilla a un reporte (distintos del estado administrativo del reporte). */
export const ESTADOS_OPERATIVOS = {
  EN_PROGRESO: "en_progreso",
  CERRADA: "cerrada",
} as const;

export type EstadoOperativo =
  (typeof ESTADOS_OPERATIVOS)[keyof typeof ESTADOS_OPERATIVOS];

/** Motivos de cierre que puede registrar la cuadrilla/operador y que nunca modifican `reportes.estado_id`. */
export const MOTIVOS_CIERRE_OPERATIVOS = [
  "trabajo_finalizado",
  "cancelada",
  "reasignada",
] as const;

export type MotivoCierreOperativo = (typeof MOTIVOS_CIERRE_OPERATIVOS)[number];

/** Motivos de cierre reservados a ADMIN: confirman el estado administrativo final del reporte. */
export const MOTIVOS_CIERRE_ADMINISTRATIVOS = [
  "reparado",
  "rechazado",
] as const;

export type MotivoCierreAdministrativo =
  (typeof MOTIVOS_CIERRE_ADMINISTRATIVOS)[number];

export type MotivoCierre = MotivoCierreOperativo | MotivoCierreAdministrativo;

/**
 * Etiquetas en español para cada estado operativo. El tipado `Record` exhaustivo
 * hace que `tsc` falle si se agrega un estado nuevo sin su etiqueta correspondiente.
 */
export const ETIQUETAS_ESTADO_OPERATIVO: Record<EstadoOperativo, string> = {
  en_progreso: "En progreso",
  cerrada: "Intervención cerrada",
};

/**
 * Etiquetas en español para cada motivo de cierre. El tipado `Record` exhaustivo
 * hace que `tsc` falle si se agrega un motivo nuevo sin su etiqueta correspondiente.
 */
export const ETIQUETAS_MOTIVO_CIERRE: Record<MotivoCierre, string> = {
  trabajo_finalizado: "Trabajo finalizado",
  cancelada: "Intervención cancelada",
  reasignada: "Reasignada a otra cuadrilla",
  reparado: "Confirmado como reparado",
  rechazado: "Confirmado como rechazado",
};
