import type { User } from "@supabase/supabase-js"

type UserMetadataLike = {
  name?: unknown
  full_name?: unknown
  first_name?: unknown
  display_name?: unknown
}

type UsernameRelation =
  | {
      username: string | null
    }
  | Array<{
      username: string | null
    }>
  | null
  | undefined

type NameRelation =
  | {
      nombre: string | null
    }
  | Array<{
      nombre: string | null
    }>
  | null
  | undefined

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function getUserDisplayName(user: Pick<User, "email" | "user_metadata"> | null | undefined, fallback = "usuario") {
  const metadata = (user?.user_metadata ?? null) as UserMetadataLike | null

  const candidate = [
    metadata?.display_name,
    metadata?.name,
    metadata?.full_name,
    metadata?.first_name,
    user?.email?.split("@")[0],
  ].find(isNonEmptyString)

  return candidate ?? fallback
}

export function getUserInitials(value: string | null | undefined, fallback = "US") {
  if (!value) {
    return fallback
  }

  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return fallback
  }

  return normalizedValue.slice(0, 2).toUpperCase()
}

export function getUsernameFromRelation(relation: UsernameRelation, fallback = "Usuario") {
  if (Array.isArray(relation)) {
    return relation[0]?.username ?? fallback
  }

  return relation?.username ?? fallback
}

export function getNameFromRelation(relation: NameRelation, fallback = "N/A") {
  if (Array.isArray(relation)) {
    return relation[0]?.nombre ?? fallback
  }

  return relation?.nombre ?? fallback
}
