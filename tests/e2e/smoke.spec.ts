import { expect, test } from "@playwright/test";

/**
 * Smoke test mínimo: la landing pública carga y los CTAs funcionan.
 * Los tests E2E de flujos auth/billing requieren cuenta de Supabase de test
 * y se agregan más adelante.
 */
test.describe("landing pública", () => {
  test("muestra contenido y CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/proyecto base/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("redirige a login al hacer clic en Entrar", async ({ page }) => {
    await page.goto("/");
    const enlaceLogin = page.getByRole("link", { name: /entrar|iniciar sesi/i }).first();
    await enlaceLogin.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("redirige a registro al hacer clic en Crear cuenta", async ({ page }) => {
    await page.goto("/");
    const enlace = page
      .getByRole("link", { name: /crear cuenta|reg[ií]strate|empezar/i })
      .first();
    await enlace.click();
    await expect(page).toHaveURL(/\/auth\/registro/);
  });
});
