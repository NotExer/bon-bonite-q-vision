import { test, expect } from '@playwright/test';

test.describe('Bon-bonite - regresión funcional', () => {
  test('E01 - navegación de módulos comerciales', async ({ page }) => {
    // El storefront mantiene recursos de terceros en carga; esperar el evento
    // `load` vuelve esta comprobación dependiente de ellos. Para validar la
    // navegación basta con que el DOM principal ya esté disponible.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
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
});
