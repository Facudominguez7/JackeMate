import { randomUUID } from "node:crypto"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Posadas downtown, so test reports land inside the map's area. */
export const POSADAS = { lat: -27.3671, lon: -55.8961 }

export const TEST_PASSWORD = "E2e-Password-123!"

export function adminClient(): SupabaseClient {
  const url = process.env.E2E_SUPABASE_URL
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Run the E2E suite with `npx playwright test`, which sets the local Supabase keys.")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** A short random tag that makes every test's rows easy to find and impossible to confuse. */
export function uniqueTag() {
  return `e2e-${randomUUID().slice(0, 8)}`
}

export type TestUser = { id: string; email: string; password: string; username: string }

/**
 * Creates the users and reports a test needs and, once the test ends, hard-deletes every row and
 * storage object it created: reports (with their photos, votes and history), then auth users
 * (which removes their profiles). Pre-existing rows are never touched.
 */
export class TestData {
  private readonly supabase = adminClient()
  private readonly userIds = new Set<string>()
  private readonly reportIds = new Set<number>()

  /** Tracks a user created through the app itself, such as one who signs up in a test. */
  trackUser(id: string) {
    this.userIds.add(id)
  }

  async trackUserByEmail(email: string) {
    const { data, error } = await this.supabase.from("profiles").select("id").eq("email", email).maybeSingle()
    if (error) throw error
    if (data) this.trackUser(data.id)
  }

  async createUser({ confirmed = true }: { confirmed?: boolean } = {}): Promise<TestUser> {
    const tag = uniqueTag()
    const email = `${tag}@e2e.reporty.test`
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: confirmed,
    })
    if (error || !data.user) throw error ?? new Error("Could not create the test user")
    this.trackUser(data.user.id)

    const username = tag.replace("-", "_")
    const { error: profileError } = await this.supabase.from("profiles").update({ username }).eq("id", data.user.id)
    if (profileError) throw profileError

    return { id: data.user.id, email, password: TEST_PASSWORD, username }
  }

  async createReport(owner: TestUser, fields: { titulo?: string; descripcion?: string; estadoId?: number } = {}) {
    const { data, error } = await this.supabase
      .from("reportes")
      .insert({
        usuario_id: owner.id,
        titulo: fields.titulo ?? `Bache de prueba ${uniqueTag()}`,
        descripcion: fields.descripcion ?? "Reporte creado por las pruebas automáticas.",
        categoria_id: 1,
        prioridad_id: 2,
        estado_id: fields.estadoId ?? 1,
        lat: POSADAS.lat,
        lon: POSADAS.lon,
      })
      .select("id, titulo")
      .single()
    if (error) throw error
    this.reportIds.add(data.id)
    return data as { id: number; titulo: string }
  }

  /** Tracks reports created through the app, by their owner. */
  async trackReportsOf(userId: string) {
    const { data, error } = await this.supabase.from("reportes").select("id").eq("usuario_id", userId)
    if (error) throw error
    for (const { id } of data) this.reportIds.add(id)
  }

  async cleanup() {
    for (const userId of this.userIds) await this.trackReportsOf(userId)
    const reportIds = [...this.reportIds]

    if (reportIds.length > 0) {
      const { data: photos, error } = await this.supabase
        .from("fotos_reporte")
        .select("path, thumbnail_path")
        .in("reporte_id", reportIds)
      if (error) throw error

      const paths = photos.flatMap((photo) => [photo.path, photo.thumbnail_path]).filter(Boolean) as string[]
      if (paths.length > 0) {
        const { error: storageError } = await this.supabase.storage.from("reportes").remove(paths)
        if (storageError) throw storageError
      }

      const { error: deleteError } = await this.supabase.from("reportes").delete().in("id", reportIds)
      if (deleteError) throw deleteError
    }

    for (const userId of this.userIds) {
      const { error } = await this.supabase.auth.admin.deleteUser(userId)
      if (error && !/not found/i.test(error.message)) throw error
    }

    this.reportIds.clear()
    this.userIds.clear()
  }
}
