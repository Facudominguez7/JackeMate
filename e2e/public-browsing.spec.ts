import { expect, test } from "./fixtures"

test.describe("public browsing, without an account", () => {
  test("the map loads with report markers", async ({ page, testData }) => {
    const owner = await testData.createUser()
    await testData.createReport(owner)

    await page.goto("/mapa")

    await expect(page.locator(".leaflet-container")).toBeVisible()
    await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible()
  })

  test("a report can be found in the list and opened", async ({ page, testData }) => {
    const owner = await testData.createUser()
    const reporte = await testData.createReport(owner, { descripcion: "Pozo profundo frente a la plaza." })

    await page.goto(`/reportes?search=${encodeURIComponent(reporte.titulo)}`)
    await page.getByRole("link", { name: new RegExp(reporte.titulo) }).first().click()

    await expect(page).toHaveURL(new RegExp(`/reportes/${reporte.id}$`))
    await expect(page.getByRole("heading", { name: "Detalle del reporte" })).toBeVisible()
    await expect(page.getByText(reporte.titulo, { exact: true })).toBeVisible()
    await expect(page.getByText("Pozo profundo frente a la plaza.")).toBeVisible()
  })

  test("the state filter leaves out reports in other states", async ({ page, testData }) => {
    const owner = await testData.createUser()
    const reporte = await testData.createReport(owner)
    const search = encodeURIComponent(reporte.titulo)

    await page.goto(`/reportes?search=${search}&estado=Pendiente`)
    await expect(page.getByText(reporte.titulo).first()).toBeVisible()

    await page.goto(`/reportes?search=${search}&estado=Reparado`)
    await expect(page.getByText(reporte.titulo)).toHaveCount(0)
  })

  test("a report that does not exist says so", async ({ page }) => {
    await page.goto("/reportes/999999999")

    await expect(page.getByText("Reporte no encontrado", { exact: true })).toBeVisible()
  })
})
