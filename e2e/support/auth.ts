import { expect, type Page } from "@playwright/test"

/** Signs in through the login form and waits for the default landing page. */
export async function signIn(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto("/auth")
  await page.getByLabel("Correo electrónico").fill(email)
  await page.getByLabel("Contraseña", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Ingresar", exact: true }).click()
  await expect(page).toHaveURL(/\/mapa$/)
}
