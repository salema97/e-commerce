import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceDisputeStatus, Prisma, SellerPayoutStatus, SellerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateMarketplaceDisputeDto,
  CreateSellerDto,
  ResolveMarketplaceDisputeDto,
  UpdateSellerDto,
} from './dto/sellers.dto.js';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  listSellers(status?: SellerStatus) {
    return this.prisma.seller.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createSeller(dto: CreateSellerDto) {
    return this.prisma.seller.create({
      data: {
        userId: dto.userId,
        businessName: dto.businessName,
        slug: dto.slug,
        commissionRate: dto.commissionRate ?? 15,
        status: SellerStatus.PENDING,
      },
    });
  }

  updateSeller(id: string, dto: UpdateSellerDto) {
    return this.prisma.seller.update({ where: { id }, data: dto });
  }

  listPayouts(sellerId?: string, status?: SellerPayoutStatus) {
    return this.prisma.sellerPayout.findMany({
      where: {
        ...(sellerId ? { sellerId } : {}),
        ...(status ? { status } : {}),
      },
      include: { seller: true, order: { select: { id: true, orderNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPayoutPaid(payoutId: string) {
    return this.prisma.sellerPayout.update({
      where: { id: payoutId },
      data: { status: SellerPayoutStatus.PAID, paidAt: new Date() },
    });
  }

  async createPayoutsForOrder(orderId: string): Promise<void> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId, sellerId: { not: null } },
      include: { seller: true },
    });
    if (!items.length) return;

    const bySeller = new Map<string, { gross: number; commission: number }>();
    for (const item of items) {
      if (!item.sellerId) continue;
      const gross = Number(item.price) * item.quantity;
      const commission = Number(item.sellerCommissionAmount ?? 0);
      const current = bySeller.get(item.sellerId) ?? { gross: 0, commission: 0 };
      bySeller.set(item.sellerId, {
        gross: current.gross + gross,
        commission: current.commission + commission,
      });
    }

    for (const [sellerId, totals] of bySeller.entries()) {
      const net = Number((totals.gross - totals.commission).toFixed(2));
      await this.prisma.sellerPayout.create({
        data: {
          sellerId,
          orderId,
          grossAmount: new Prisma.Decimal(totals.gross),
          commissionAmount: new Prisma.Decimal(totals.commission),
          netAmount: new Prisma.Decimal(net),
          status: SellerPayoutStatus.PENDING,
        },
      });
    }
  }

  listDisputes(status?: MarketplaceDisputeStatus) {
    return this.prisma.marketplaceDispute.findMany({
      where: status ? { status } : undefined,
      include: {
        seller: true,
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async openDispute(userId: string, dto: CreateMarketplaceDisputeDto) {
    const seller = await this.prisma.seller.findUnique({ where: { id: dto.sellerId } });
    if (!seller || seller.status !== SellerStatus.ACTIVE) {
      throw new BadRequestException('Seller not found or inactive');
    }
    return this.prisma.marketplaceDispute.create({
      data: {
        orderId: dto.orderId,
        sellerId: dto.sellerId,
        openedByUserId: userId,
        reason: dto.reason,
      },
    });
  }

  resolveDispute(id: string, dto: ResolveMarketplaceDisputeDto) {
    return this.prisma.marketplaceDispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: new Date(),
      },
    });
  }
}
