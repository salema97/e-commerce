import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class B2bPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveUnitPrice(
    companyId: string | undefined,
    productId: string,
    variantId: string | undefined,
    quantity: number,
    fallbackPrice: number,
  ): Promise<number> {
    if (!companyId) {
      return fallbackPrice;
    }

    const negotiated = await this.prisma.companyPriceList.findFirst({
      where: {
        companyId,
        productId,
        variantId: variantId ?? null,
        minQuantity: { lte: quantity },
      },
      orderBy: { minQuantity: 'desc' },
    });

    if (negotiated) {
      return Number(negotiated.unitPrice);
    }

    const productLevel = await this.prisma.companyPriceList.findFirst({
      where: {
        companyId,
        productId,
        variantId: null,
        minQuantity: { lte: quantity },
      },
      orderBy: { minQuantity: 'desc' },
    });

    return productLevel ? Number(productLevel.unitPrice) : fallbackPrice;
  }

  async assertCreditAvailable(companyId: string, amount: number): Promise<void> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const available = Number(company.creditLimit) - Number(company.creditUsed);
    if (amount > available) {
      throw new BadRequestException(`Credit limit exceeded. Available: ${available.toFixed(2)}`);
    }
  }

  async applyCreditUsage(companyId: string, amount: number): Promise<void> {
    await this.prisma.company.update({
      where: { id: companyId },
      data: { creditUsed: { increment: new Prisma.Decimal(amount) } },
    });
  }
}
