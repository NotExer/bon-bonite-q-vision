import { test, expect } from '@playwright/test';

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

  test('E03 - compra de producto hasta checkout sin pago real', async ({ page }) => {
    await page.goto('/producto/tacon-en-cuero-chantilly/');
    await expect(page.getByRole('heading', { name: /zueco en cuero chantilly/i })).toBeVisible();
    // El select original está oculto; el usuario interactúa con el botón visible de talla.
    await page.getByRole('button', { name: '36', exact: true }).click();
    // La cantidad visible inicia en 1; el input auxiliar está oculto.
    await expect(page.locator('input[name="quantity"]')).toHaveValue('1');
    await page.getByRole('button', { name: /añadir al carrito/i }).click();
    await expect(page.locator('.cart-contents').first()).not.toHaveText('0');
    await page.goto('/carrito/');
    await expect(page.locator('body')).toContainText(/zueco en cuero chantilly/i);
    const checkout = page.getByRole('link', { name: /finalizar compra|checkout/i }).first();
    if (await checkout.count()) {
      await checkout.click();
      await expect(page).toHaveURL(/checkout|finalizar-compra/);
      await expect(page.locator('body')).toContainText(/detalles de facturación|billing details/i);
    }
    // Corte intencional: no se envían datos personales ni se confirma el pago.
  });
});
