import { test, expect } from '@playwright/test';

const env = {
  cedula: process.env.BONBONITE_CEDULA ?? '',
  password: process.env.BONBONITE_PASSWORD ?? '',
  name: process.env.BONBONITE_NAME ?? 'Cliente QA',
  email: process.env.BONBONITE_EMAIL ?? '',
};

test.describe('Bon-bonite - regresión funcional', () => {
  test('E01 - navegación de módulos comerciales', async ({ page }) => {
    await page.goto('/');
    const modules = [
      ['Zapatos', '/categoria-producto/zapatos-mujer/'], ['Bolsos', '/categoria-producto/bolsos-mujer/'],
      ['Cinturones', '/categoria-producto/cinturones-mujer/'], ['Accesorios', '/categoria-producto/accesorios-mujer/'],
      ['Outlet', '/categoria-producto/outlet/'], ['Bonos de regalo', '/producto/bono-de-regalo/'],
      ['Mi cuenta', '/mi-cuenta/'], ['PQRS', '/pqrs/'],
    ] as const;
    for (const [label, href] of modules) {
      const link = page.getByRole('link', { name: label, exact: true }).first();
      await expect(link, `Módulo visible: ${label}`).toBeVisible();
      await expect(link).toHaveAttribute('href', new RegExp(href.replaceAll('/', '\\/')));
    }
  });

  test('E02 - registro y actualización de usuario', async ({ page }) => {
    test.skip(!env.cedula || !env.password || !env.email, 'Definir BONBONITE_CEDULA, BONBONITE_PASSWORD y BONBONITE_EMAIL.');
    await page.goto('/mi-cuenta/');
    await page.locator('#reg_username').fill(env.cedula);
    await page.locator('#first_name').fill(env.name);
    await page.locator('#last_name').fill('QA');
    await page.locator('#reg_email').fill(env.email);
    await page.locator('#reg_password').fill(env.password);
    await page.locator('#reg_password2').fill(env.password);
    await page.locator('#newsletter_authorization').check();
    await page.locator('#privacy_policy_reg').check();
    await page.locator('button[name="register"]').click();
    await expect(page).toHaveURL(/mi-cuenta/);
    await page.locator('#username').fill(env.cedula);
    await page.locator('#password').fill(env.password);
    await page.locator('button[name="login"]').click();
    await expect(page.locator('body')).toContainText(/mi cuenta|my account/i);
    const details = page.getByRole('link', { name: /detalles de la cuenta|account details/i }).first();
    if (await details.count()) await details.click();
    const firstName = page.locator('input[name="account_first_name"], input[name="first_name"]').first();
    if (await firstName.count()) {
      await firstName.fill(`${env.name} Actualizado`);
      await page.getByRole('button', { name: /guardar cambios|save changes/i }).click();
      await expect(page.locator('body')).toContainText(/detalles de la cuenta|account details/i);
    }
  });

  test('E03 - compra de producto hasta checkout sin pago real', async ({ page }) => {
    await page.goto('/producto/tacon-en-cuero-chantilly/');
    await expect(page.getByRole('heading', { name: /zueco en cuero chantilly/i })).toBeVisible();
    await page.locator('select[name="attribute_pa_talla"]').selectOption({ label: '36' });
    await page.locator('input[name="quantity"]').fill('1');
    await page.getByRole('button', { name: /añadir al carrito/i }).click();
    await expect(page.locator('.cart-contents')).not.toHaveText('0');
    await page.goto('/carrito/');
    await expect(page.locator('body')).toContainText(/zueco en cuero chantilly/i);
    const checkout = page.getByRole('link', { name: /finalizar compra|checkout/i }).first();
    if (await checkout.count()) {
      await checkout.click();
      await expect(page).toHaveURL(/checkout/);
      await expect(page.locator('body')).toContainText(/detalles de facturación|billing details/i);
    }
    // Corte intencional: no se envían datos personales ni se confirma el pago.
  });
});
