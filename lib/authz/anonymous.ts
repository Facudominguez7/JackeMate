import type { User } from "@supabase/supabase-js"

type CandidateAnonymousUser = {
  is_anonymous?: boolean | null
  isAnonymous?: boolean | null
  app_metadata?: {
    provider?: string | null
    providers?: string[] | null
  } | null
}

export function isAnonymousUser(user: User | CandidateAnonymousUser | null | undefined) {
  if (!user) return false

  const candidate = user as CandidateAnonymousUser

  if (typeof candidate.is_anonymous === "boolean") {
    return candidate.is_anonymous
  }

  if (typeof candidate.isAnonymous === "boolean") {
    return candidate.isAnonymous
  }

  const provider = candidate.app_metadata?.provider
  if (provider === "anonymous") {
    return true
  }

  return (candidate.app_metadata?.providers ?? []).includes("anonymous")
}
