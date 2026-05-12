import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('login muestra formulario de acceso', async ({ page }) => {
    await page.goto('/login/');
    await expect(page.getByText(/Bienvenido de nuevo/i)).toBeVisible();
    await expect(page.getByLabel(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible();
  });

  test('sin token, /panel redirige a login', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('kiora_token');
        localStorage.removeItem('kiora_user');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/panel/');
    await expect(page).toHaveURL(/\/login\/?/);
  });
});
