import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CompanyUserRole, NetPaymentTerms } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkOrderRowDto, CreateCompanyDto, UpdateCompanyDto, UpsertCompanyPriceDto } from './dto/b2b.dto.js';
import { B2bPricingService } from './b2b-pricing.service.js';
import { QuotesService } from '../quotes/quotes.service.js';

@Injectable()
export class B2bService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: B2bPricingService,
    @Inject(forwardRef(() => QuotesService)) private readonly quotesService: QuotesService,
  ) {}

  listCompanies() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { users: { include: { user: { select: { email: true, name: true } } } } },
    });
  }

  async createCompany(dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: dto.name,
        taxId: dto.taxId,
        creditLimit: dto.creditLimit ?? 0,
        netPaymentTerms: dto.netPaymentTerms ?? NetPaymentTerms.NET_30,
      },
    });
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    await this.ensureCompany(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async addUser(companyId: string, userId: string, role: CompanyUserRole = CompanyUserRole.BUYER) {
    await this.ensureCompany(companyId);
    return this.prisma.companyUser.upsert({
      where: { companyId_userId: { companyId, userId } },
      create: { companyId, userId, role },
      update: { role },
      include: { user: { select: { email: true, name: true } } },
    });
  }

  async upsertPrice(companyId: string, dto: UpsertCompanyPriceDto) {
    await this.ensureCompany(companyId);
    const variantId = dto.variantId ?? null;
    const existing = await this.prisma.companyPriceList.findFirst({
      where: { companyId, productId: dto.productId, variantId },
    });

    if (existing) {
      return this.prisma.companyPriceList.update({
        where: { id: existing.id },
        data: { unitPrice: dto.unitPrice, minQuantity: dto.minQuantity ?? 1 },
      });
    }

    return this.prisma.companyPriceList.create({
      data: {
        companyId,
        productId: dto.productId,
        variantId,
        unitPrice: dto.unitPrice,
        minQuantity: dto.minQuantity ?? 1,
      },
    });
  }

  listPrices(companyId: string) {
    return this.prisma.companyPriceList.findMany({ where: { companyId } });
  }

  async myCompany(userId: string) {
    const membership = await this.prisma.companyUser.findFirst({
      where: { userId },
      include: { company: true },
    });
    return membership;
  }

  async bulkImportQuote(companyId: string, userId: string, rows: BulkOrderRowDto[]) {
    if (rows.length === 0) {
      throw new BadRequestException('CSV must contain at least one row');
    }

    const items = [];
    const errors: Array<{ row: number; message: string }> = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const product = await this.prisma.product.findUnique({
        where: { id: row.productId },
        include: { variants: true },
      });
      if (!product) {
        errors.push({ row: index + 1, message: `Product ${row.productId} not found` });
        continue;
      }

      const variant = row.variantId
        ? product.variants.find((entry) => entry.id === row.variantId)
        : undefined;
      const basePrice = Number(variant?.price ?? product.price);
      const unitPrice = await this.pricing.resolveUnitPrice(
        companyId,
        product.id,
        row.variantId,
        row.quantity,
        basePrice,
      );

      items.push({
        productId: product.id,
        variantId: row.variantId,
        quantity: row.quantity,
        unitPrice,
      });
    }

    if (items.length === 0) {
      throw new BadRequestException('No valid rows to import', { cause: errors });
    }

    const quote = await this.quotesService.create(userId, {
      companyId,
      items,
      notes: 'Bulk CSV import',
    });

    return { quoteId: quote.id, quoteNumber: quote.quoteNumber, rowsProcessed: items.length, errors };
  }

  private async ensureCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return company;
  }
}
