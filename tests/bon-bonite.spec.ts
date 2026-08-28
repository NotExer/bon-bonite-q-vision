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

    // El usuario selecciona la talla mediante el botón visible. Esperamos a que
    // el select interno se actualice antes de enviar el formulario.
    const sizeSelect = page.locator('select[name="attribute_pa_talla"]');
    await page.getByRole('button', { name: '36', exact: true }).click();
    await expect(sizeSelect).toHaveValue('36');
    await expect(page.locator('input[name="variation_id"]')).toHaveValue(/^[1-9]\d*$/);

    // La cantidad visible inicia en 1; el input auxiliar está oculto.
    await expect(page.locator('input[name="quantity"]')).toHaveValue('1');
    // Validamos el envío real del formulario de compra. El storefront puede
    // redirigir al runner de GitHub según su IP, pero la solicitud POST al
    // producto sigue siendo observable y contiene la variación seleccionada.
    const addToCartRequestPromise = page.waitForRequest((request) =>
      request.method() === 'POST' &&
      request.url().includes('/producto/tacon-en-cuero-chantilly/'),
    );
    await page.getByRole('button', { name: /añadir al carrito/i }).click();
    const addToCartRequest = await addToCartRequestPromise;
    const postData = addToCartRequest.postData() ?? '';
    expect(postData).toMatch(/variation_id/);
    expect(postData).toMatch(/attribute_pa_talla/);
    expect(postData).toMatch(/quantity/);

    // El endpoint de checkout debe estar disponible, pero no se envían datos
    // personales ni se confirma ningún pago.
    const checkoutResponse = await page.request.get(
      'https://www.bon-bonite.com/finalizar-compra/',
      { maxRedirects: 0 },
    );
    expect(checkoutResponse.status()).toBeLessThan(400);

    if (checkoutResponse.status() === 200) {
      const checkoutBody = await checkoutResponse.text();
      expect(checkoutBody).toMatch(/finalizar compra|checkout|detalles de facturación|billing details/i);
    } else {
      const redirectLocation = checkoutResponse.headers().location ?? '';
      expect(redirectLocation).toMatch(/bon-bonite\.us|checkout|finalizar-compra/i);
      test.info().annotations.push({
        type: 'note',
        description: `El runner fue redirigido por geolocalización: ${redirectLocation}`,
      });
    }
  });
});
