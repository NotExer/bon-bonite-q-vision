import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const STORE_API = '/wp-json/wc/store/v1';
const DEFAULT_LIMIT_PER_CATEGORY = 5;

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const stripHtml = (value: string) => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

type Product = {
  id: number;
  name: string;
  permalink: string;
  short_description: string;
  description: string;
  prices: { price: string; currency_code: string };
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ name: string }>;
};

type Category = { id: number; name: string; slug: string; count: number };

async function getAllProducts(request: APIRequestContext, categoryId: number) {
  const products: Product[] = [];
  let pageNumber = 1;
  while (true) {
    const response = await request.get(`${STORE_API}/products`, {
      params: { category: String(categoryId), per_page: '100', page: String(pageNumber) },
    });
    expect(response.ok()).toBeTruthy();
    const pageProducts = await response.json() as Product[];
    products.push(...pageProducts);
    if (pageProducts.length < 100) break;
    pageNumber += 1;
  }
  return products;
}

test.describe('Bon-bonite - auditoría de catálogo API/front', () => {
  test('CAT-01 - los productos de cada categoría pintan datos consistentes', async ({ request, page }) => {
    test.setTimeout(30 * 60 * 1000);
    const configuredLimit = Number(process.env.PRODUCT_AUDIT_LIMIT ?? DEFAULT_LIMIT_PER_CATEGORY);
    const response = await request.get(`${STORE_API}/products/categories`, {
      params: { per_page: '100' },
    });
    expect(response.ok()).toBeTruthy();
    const categories = await response.json() as Category[];
    const targets = [
      'zapatos-mujer',
      'bolsos-mujer',
      'cinturones-mujer',
      'accesorios-mujer',
      'outlet',
    ];
    const failures: string[] = [];

    for (const slug of targets) {
      const category = categories.find((item) => item.slug === slug);
      expect(category, `Categoría no encontrada: ${slug}`).toBeTruthy();
      const products = await getAllProducts(request, category!.id);
      const selected = configuredLimit === 0 ? products : products.slice(0, configuredLimit);
      expect(selected.length, `Sin productos para ${category!.name}`).toBeGreaterThan(0);

      for (const product of selected) {
        try {
          await test.step(`${category!.name}: ${product.name}`, async () => {
            expect(product.name).toBeTruthy();
            expect(product.permalink).toMatch(/^https:\/\/www\.bon-bonite\.com\/producto\//);
            expect(product.images.length, 'El producto debe tener imagen en la API').toBeGreaterThan(0);
            expect(product.prices.price, 'El producto debe tener precio en la API').toMatch(/^\d+$/);
            expect(product.prices.currency_code).toBe('COP');

            await page.goto(product.permalink, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            const heading = page.getByRole('heading', { level: 1 }).first();
            await expect(heading).toBeVisible();
            const headingText = normalize(await heading.innerText());
            expect(headingText).toContain(normalize(product.name));

            const mainText = await page.locator('body').innerText();
            const mainNormalized = normalize(mainText);
            const priceDigits = product.prices.price.replace(/\D/g, '');
            expect(mainText.replace(/\D/g, '')).toContain(priceDigits);

            const expectedImageName = product.images[0].src.split('/').pop()?.split('?')[0] ?? '';
            const renderedImages = await page.locator('img').evaluateAll((images) => images.map((image) => ({
              src: image.getAttribute('src') ?? '',
              alt: image.getAttribute('alt') ?? '',
              lazySrc: image.getAttribute('data-src') ?? image.getAttribute('data-lazy-src') ?? '',
            })));
            expect(renderedImages.some((image) =>
              image.src.includes(expectedImageName) ||
              image.lazySrc.includes(expectedImageName) ||
              normalize(image.alt).includes(normalize(product.name))
            ), 'La imagen de la API debe estar representada en el front').toBeTruthy();

            const description = stripHtml(product.short_description || product.description);
            const descriptionBody = description.split('•').slice(1).join(' • ') || description;
            const descriptionTerms = normalize(descriptionBody).split(' ').filter((word) => word.length > 2).slice(0, 5);
            for (const term of descriptionTerms) {
              expect(mainNormalized, `El término de descripción no aparece: ${term}`).toContain(term);
            }
          });
        } catch (error) {
          failures.push(`${category!.name} / ${product.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    expect(failures, `Inconsistencias API/front:\n${failures.join('\n')}`).toEqual([]);
  });
});
