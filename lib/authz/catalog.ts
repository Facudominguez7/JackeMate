export const ROLE_IDS = {
  ADMIN: 1,
  CIUDADANO: 2,
  INTERESADO: 3,
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
] as const;

export const ADMIN_REPORT_STATE_IDS = [
  REPORT_STATE_IDS.REPARADO,
  REPORT_STATE_IDS.RECHAZADO,
] as const;
