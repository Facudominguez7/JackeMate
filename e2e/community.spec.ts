import { expect, test } from "./fixtures"
import { signIn } from "./support/auth"
import { adminClient, uniqueTag } from "./support/test-data"

type CapturedEmail = { to: string[]; subject: string; text: string; html: string }

/** Poll the local capture: a successful mutation alone does not prove email delivery. */
async function notification(to: string, subject: string): Promise<CapturedEmail> {
  let matches: CapturedEmail[] = []
  await expect.poll(async () => {
    const response = await fetch(`${process.env.E2E_FAKE_RESEND_URL}/emails?to=${encodeURIComponent(to)}`)
    expect(response.ok).toBeTruthy()
    const emails = await response.json() as CapturedEmail[]
    matches = emails.filter((email) => email.subject === subject)
    return matches.length
  }).toBe(1)
  return matches[0]
}

test.describe("community", () => {
  test("a citizen comments and the report owner receives the notification", async ({ page, testData }) => {
    const owner = await testData.createUser()
    const citizen = await testData.createUser()
    const report = await testData.createReport(owner)
    const comment = `Actualización ${uniqueTag()}`
    await signIn(page, citizen)
    await page.goto(`/reportes/${report.id}`)
    await page.getByRole("textbox").fill(comment)
    await page.getByRole("button", { name: "Publicar", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Publicar Comentario" }).click()
    await expect(page.getByRole("alertdialog")).toBeHidden()
    await expect(page.getByRole("textbox")).toHaveValue("")
    await expect(page.getByText(comment, { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText(comment, { exact: true })).toBeVisible()

    const email = await notification(owner.email, `Nuevo comentario en tu reporte: ${report.titulo}`)
    expect(email.to).toEqual([owner.email])
    expect(email.text).toContain(comment)
    expect(email.text).toContain(citizen.username)
    expect(email.text).toContain(report.titulo)
    expect(email.text).toContain(`/reportes/${report.id}`)
    expect(email.html).toContain(comment)
  })

  test("a citizen votes repaired and the closed state persists", async ({ page, testData }) => {
    const owner = await testData.createUser()
    const citizen = await testData.createUser()
    const report = await testData.createReport(owner)
    await signIn(page, citizen)
    await page.goto(`/reportes/${report.id}`)
    await page.getByRole("button", { name: /^Votar que está reparado\./ }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Confirmar Voto" }).click()
    await expect(page.getByText("Este reporte está cerrado.", { exact: false })).toBeVisible()
    await page.reload()
    await expect(page.getByText("Este reporte está cerrado.", { exact: false })).toBeVisible()
    await expect(page.getByRole("button", { name: /^Votar que/ })).toHaveCount(0)
    const email = await notification(owner.email, `Tu reporte "${report.titulo}" cambió de estado`)
    expect(email.text).toContain("Reparado")
    expect(email.text).toContain(`/reportes/${report.id}`)
  })

  test("an administrator changes state and the owner receives the notification", async ({ page, testData }) => {
    const owner = await testData.createUser()
    const admin = await testData.createUser()
    // Only elevate this disposable local user, never a pre-existing profile.
    const { data, error } = await adminClient().from("profiles").update({ rol_id: 1 }).eq("id", admin.id).select("rol_id").single()
    expect(error).toBeNull()
    expect(data?.rol_id).toBe(1)
    const report = await testData.createReport(owner)
    const description = `Reparación verificada ${uniqueTag()}`
    await signIn(page, admin)
    await page.goto(`/reportes/${report.id}`)
    await page.getByRole("button", { name: "Abrir herramientas de administrador" }).click()
    const panel = page.getByRole("dialog", { name: "Panel de Administrador" })
    await panel.getByRole("combobox").click()
    await page.getByRole("option", { name: "Reparado", exact: true }).click()
    await panel.getByPlaceholder("Descripción del cambio (opcional)").fill(description)
    await panel.getByRole("button", { name: "Actualizar Estado", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Confirmar Cambio" }).click()
    await expect(page.getByText("Estado actualizado exitosamente")).toBeVisible()
    await expect(page.getByText("Este reporte está cerrado.", { exact: false })).toBeVisible()
    await page.reload()
    await expect(page.getByText("Este reporte está cerrado.", { exact: false })).toBeVisible()
    const email = await notification(owner.email, `Tu reporte "${report.titulo}" cambió de estado`)
    expect(email.to).toEqual([owner.email])
    expect(email.text).toContain("Reparado")
    expect(email.text).toContain(description)
    expect(email.text).toContain(report.titulo)
    expect(email.text).toContain(`/reportes/${report.id}`)
  })
})
