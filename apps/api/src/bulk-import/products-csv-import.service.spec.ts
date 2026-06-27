import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ProductsCsvImportService } from './products-csv-import.service.js';

describe('ProductsCsvImportService', () => {
  const searchSync = { syncProduct: vi.fn() };
  const prisma = {
    category: { findUnique: vi.fn() },
    product: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventory: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const service = new ProductsCsvImportService(prisma as never, searchSync as never);

  it('rejects CSV without required headers', async () => {
    const result = await service.importCsv('name,slug\nFoo,foo');
    expect(result.failed).toBe(0);
    expect(result.errors[0]?.message).toContain('price');
  });

  it('creates a product row', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    prisma.product.create.mockResolvedValue({ id: 'p1' });
    prisma.inventory.findFirst.mockResolvedValue(null);
    prisma.inventory.create.mockResolvedValue({ id: 'inv1' });

    const csv = [
      'name,slug,sku,price,categorySlug,stock,status,description',
      'Camiseta,camiseta,CAM-001,19.99,,10,ACTIVE,Camiseta algodón',
    ].join('\n');

    const result = await service.importCsv(csv);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Camiseta',
        slug: 'camiseta',
        price: new Prisma.Decimal(19.99),
        status: 'ACTIVE',
      }),
    });
  });
});
