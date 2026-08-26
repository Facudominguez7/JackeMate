import { createClient } from "@/utils/supabase/server"
import { HeaderClient } from "./header-client"

export default async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  return <HeaderClient user={user} />
}
