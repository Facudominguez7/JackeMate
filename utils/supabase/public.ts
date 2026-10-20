import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cookie-less Supabase client that always acts as the anon role.
 * Use it only for public data that is identical for every visitor,
 * such as lookup tables read inside `unstable_cache`.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
