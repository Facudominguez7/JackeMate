import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { DASHBOARD_ROLE_IDS, REPORT_CREATOR_ROLE_IDS, ROLE_IDS, type RoleId } from "./catalog";

type RoleRelation =
  | {
      nombre: string | null;
    }
  | Array<{
      nombre: string | null;
    }>
  | null;

type ProfileRoleRow = {
  rol_id: number | null;
  roles: RoleRelation;
};

export type UserRoleContext = {
  roleId: RoleId | null;
  roleName: string | null;
};

function getRoleName(roles: RoleRelation) {
  if (Array.isArray(roles)) {
    return roles[0]?.nombre ?? null;
  }

  return roles?.nombre ?? null;
}

function toRoleId(roleId: number | null | undefined): RoleId | null {
  if (roleId === ROLE_IDS.ADMIN || roleId === ROLE_IDS.CIUDADANO || roleId === ROLE_IDS.INTERESADO) {
    return roleId;
  }

  return null;
}

export async function getUserRoleContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserRoleContext | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("rol_id, roles (nombre)")
    .eq("id", userId)
    .single();

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      roleId: toRoleId(data?.rol_id),
      roleName: getRoleName((data as ProfileRoleRow | null)?.roles ?? null),
    },
    error: null,
  };
}

export function canCreateReports(roleId: number | null | undefined) {
  return REPORT_CREATOR_ROLE_IDS.includes(roleId as (typeof REPORT_CREATOR_ROLE_IDS)[number]);
}

export function canViewDashboard(roleId: number | null | undefined) {
  return DASHBOARD_ROLE_IDS.includes(roleId as (typeof DASHBOARD_ROLE_IDS)[number]);
}

export function isAdminRole(roleId: number | null | undefined) {
  return roleId === ROLE_IDS.ADMIN;
}
