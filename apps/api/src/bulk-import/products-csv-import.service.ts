import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductSearchSyncService } from '../ai/search/product-search-sync.service.js';

export interface BulkImportRowError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errors: BulkImportRowError[];
}

const REQUIRED_HEADERS = ['name', 'slug', 'price'] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeStatus(value: string | undefined): ProductStatus {
  const normalized = (value ?? 'DRAFT').toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'ARCHIVED' || normalized === 'DRAFT') {
    return normalized;
  }
  return 'DRAFT';
}

@Injectable()
export class ProductsCsvImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchSync: ProductSearchSyncService,
  ) {}

  async importCsv(csv: string): Promise<BulkImportResult> {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return {
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [{ row: 1, message: 'CSV must include a header row and at least one data row' }],
      };
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
    for (const required of REQUIRED_HEADERS) {
      if (!headers.includes(required)) {
        return {
          totalRows: 0,
          created: 0,
          updated: 0,
          failed: 0,
          errors: [{ row: 1, message: `Missing required column: ${required}` }],
        };
      }
    }

    const result: BulkImportResult = {
      totalRows: lines.length - 1,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (let index = 1; index < lines.length; index += 1) {
      const rowNumber = index + 1;
      const values = parseCsvLine(lines[index]);
      const record = Object.fromEntries(
        headers.map((header, columnIndex) => [header, values[columnIndex] ?? '']),
      );

      try {
        const outcome = await this.upsertRow(record);
        if (outcome === 'created') {
          result.created += 1;
        } else {
          result.updated += 1;
        }
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }

    return result;
  }

  private async upsertRow(record: Record<string, string>): Promise<'created' | 'updated'> {
    const name = record.name?.trim();
    const slug = record.slug?.trim();
    const price = Number(record.price);

    if (!name || !slug) {
      throw new Error('name and slug are required');
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error('price must be a non-negative number');
    }

    const sku = record.sku?.trim() || undefined;
    const description = record.description?.trim() || undefined;
    const status = normalizeStatus(record.status);
    const stock = record.stock ? Number(record.stock) : undefined;
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      throw new Error('stock must be a non-negative integer');
    }

    let categoryId: string | undefined;
    const categorySlug = record.categoryslug?.trim() || record.category_slug?.trim();
    if (categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!category) {
        throw new Error(`Unknown category slug: ${categorySlug}`);
      }
      categoryId = category.id;
    }

    const existing = await this.prisma.product.findUnique({ where: { slug } });
    const data = {
      name,
      slug,
      sku,
      description,
      status,
      price: new Prisma.Decimal(price),
      categoryId,
    };

    if (existing) {
      const product = await this.prisma.product.update({
        where: { id: existing.id },
        data,
      });
      if (stock !== undefined) {
        await this.ensureInventory(product.id, stock);
      }
      void this.searchSync.syncProduct(product.id);
      return 'updated';
    }

    const product = await this.prisma.product.create({ data });
    await this.ensureInventory(product.id, stock ?? 0);
    void this.searchSync.syncProduct(product.id);
    return 'created';
  }

  private async ensureInventory(productId: string, quantity: number): Promise<void> {
    const existing = await this.prisma.inventory.findFirst({ where: { productId } });
    if (existing) {
      await this.prisma.inventory.update({
        where: { id: existing.id },
        data: { quantity },
      });
      return;
    }

    await this.prisma.inventory.create({
      data: { productId, quantity, reservedQuantity: 0 },
    });
  }
}
