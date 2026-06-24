import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { mapProductToMeiliDocument } from './meili-product.mapper.js';
import type { ProductForIndex } from './meili-product.mapper.js';

function baseProduct(overrides: Partial<ProductForIndex> = {}): ProductForIndex {
  return {
    id: 'p1',
    name: 'Zapatos',
    slug: 'zapatos',
    description: 'Cómodos',
    status: 'ACTIVE',
    price: new Prisma.Decimal(49.99),
    compareAtPrice: null,
    isFeatured: false,
    createdAt: new Date('2026-01-01'),
    category: { id: 'c1', slug: 'calzado', name: 'Calzado' },
    supplier: { name: 'Proveedor SA' },
    attributes: [
      { name: 'Marca', value: 'Nike' },
      { name: 'Color', value: 'Rojo Oscuro' },
    ],
    images: [{ url: 'https://cdn.example/p.jpg' }],
    inventory: [{ quantity: 10, reservedQuantity: 2 }],
    ...overrides,
  };
}

describe('mapProductToMeiliDocument', () => {
  it('maps brand from Marca attribute and builds attribute facets', () => {
    const doc = mapProductToMeiliDocument(baseProduct());

    expect(doc.brand).toBe('Nike');
    expect(doc.attributeFacets).toContain('Color:rojo-oscuro');
    expect(doc.inStock).toBe(true);
    expect(doc.price).toBe(49.99);
    expect(doc.categorySlug).toBe('calzado');
  });

  it('marks out of stock when no available inventory', () => {
    const doc = mapProductToMeiliDocument(
      baseProduct({ inventory: [{ quantity: 1, reservedQuantity: 1 }] }),
    );
    expect(doc.inStock).toBe(false);
  });
});
