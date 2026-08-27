# Automatización QA - Bon-bonite

Proyecto de automatización funcional para la primera versión de [bon-bonite.com](https://www.bon-bonite.com/), construido con Playwright y TypeScript.

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

Para ejecutar registro y actualización, configurar valores de prueba en la sesión:

```bash
$env:BONBONITE_CEDULA='...'
$env:BONBONITE_PASSWORD='...'
$env:BONBONITE_EMAIL='qa@example.com'
$env:BONBONITE_NAME='Cliente QA'
npm test
```

La URL pública del repositorio debe reemplazarse en el libro de entrega una vez publicado en GitHub/GitLab/Bitbucket. Propuesta de nombre: `bon-bonite-qa-automation`.
