# Automatización QA - Bon-bonite

Proyecto de automatización funcional para la primera versión de [bon-bonite.com](https://www.bon-bonite.com/), construido con Playwright y TypeScript.

Repositorio: https://github.com/NotExer/bon-bonite-q-vision

## Estructura

```text
tests/bon-bonite.spec.ts  # escenarios E01, E02 y E03
tests/catalog-api.spec.ts # auditoría API/UI del catálogo
playwright.config.ts      # configuración, reportes y evidencias
package.json              # scripts y dependencias
```

## Escenarios automatizados

1. Navegación y disponibilidad de los módulos Zapatos, Bolsos, Cinturones, Accesorios, Outlet, Bonos de regalo, Mi cuenta y PQRS.
2. Registro, inicio de sesión y actualización de datos del usuario. Se ejecuta únicamente cuando se proporcionan datos de prueba autorizados mediante variables de entorno.
3. Selección de talla, adición de un producto al carrito y llegada al checkout. El flujo se detiene antes de enviar información personal o realizar un pago.

## Ejecución

```bash
npm install
npx playwright install chromium
npm test
```

Para ejecutar un escenario específico:

```bash
npx playwright test -g "E01"
npx playwright test -g "E03"
npm run test:catalog
```

La auditoría de catálogo consulta la Store API pública de WooCommerce y compara cada producto seleccionado contra su página visible: nombre, precio, moneda, imagen y fragmento de descripción. Por defecto revisa 5 productos por categoría para mantener una ejecución práctica. Para auditar todos los productos de Zapatos, Bolsos, Cinturones, Accesorios y Outlet:

```powershell
$env:PRODUCT_AUDIT_LIMIT='0'
npm run test:catalog
```

Para ejecutar registro y actualización, configurar valores de prueba en la sesión:

```bash
$env:BONBONITE_CEDULA='...'
$env:BONBONITE_PASSWORD='...'
$env:BONBONITE_EMAIL='qa@example.com'
$env:BONBONITE_NAME='Cliente QA'
npm test
```

## Evidencias y límites

En caso de fallo, Playwright conserva screenshot, video y trace. El escenario E03 llega hasta checkout y no confirma un pago. El escenario E02 requiere datos de prueba autorizados y se omite si faltan las variables de entorno.

En la ejecución entregada, E01 y E03 pasan; E02 queda omitido/bloqueado porque no se cuenta con datos de prueba autorizados. No se utilizan datos reales ni se publican credenciales.

La ejecución continua está definida en `.github/workflows/playwright.yml`.
