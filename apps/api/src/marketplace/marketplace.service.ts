import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarketplaceChannel,
  MarketplaceImportStatus,
  MarketplaceListingStatus,
  OrderChannel,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { MarketplaceChannelFactory } from './marketplace.factory.js';
import type { MarketplaceImportOrderDto } from './dto/marketplace.dto.js';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: MarketplaceChannelFactory,
    private readonly reservation: InventoryReservationService,
  ) {}

  listProfiles() {
    return this.factory.listProfiles();
  }

  listListings(channel?: MarketplaceChannel) {
    return this.prisma.marketplaceListing.findMany({
      where: channel ? { channel } : undefined,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async syncProduct(productId: string, channel?: MarketplaceChannel) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const stock = product.inventory.reduce(
      (sum, row) => sum + Math.max(0, row.quantity - row.reservedQuantity),
      0,
    );

    const adapter = this.factory.getAdapter(channel);
    const result = await adapter.syncListing({
      productId: product.id,
      title: product.name,
      description: product.description,
      price: Number(product.price),
      stock,
      sku: product.sku,
    });

    return await this.prisma.marketplaceListing.upsert({
      where: { productId_channel: { productId, channel: adapter.channel } },
      create: {
        productId,
        channel: adapter.channel,
        externalId: result.externalId,
        status: result.status,
        lastSyncedAt: new Date(),
      },
      update: {
        externalId: result.externalId,
        status: result.status,
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });
  }

  async importOrder(dto: MarketplaceImportOrderDto) {
    const adapter = this.factory.getAdapter(dto.channel);
    const existing = await this.prisma.marketplaceOrderImport.findUnique({
      where: { channel_externalOrderId: { channel: dto.channel, externalOrderId: dto.externalOrderId } },
    });
    if (existing?.orderId) {
      throw new BadRequestException('Marketplace order already imported');
    }

    await adapter.importOrder(dto);

    const importRecord = await this.prisma.marketplaceOrderImport.upsert({
      where: {
        channel_externalOrderId: { channel: dto.channel, externalOrderId: dto.externalOrderId },
      },
      create: {
        channel: dto.channel,
        externalOrderId: dto.externalOrderId,
        fees: dto.fees,
        payload: dto as unknown as object,
        status: MarketplaceImportStatus.PENDING,
      },
      update: {},
    });

    await this.reservation.reserveItems(
      dto.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    );

    const subtotal = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const shippingAmount = 0;
    const total = Number((subtotal + taxAmount + shippingAmount).toFixed(2));

    const order = await this.prisma.order.create({
      data: {
        orderNumber: `MP-${Date.now().toString(36).toUpperCase()}`,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        status: OrderStatus.PROCESSING,
        channel: OrderChannel.MARKETPLACE,
        marketplaceChannel: dto.channel,
        marketplaceExternalId: dto.externalOrderId,
        marketplaceFees: dto.fees,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount: 0,
        total,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        statusHistory: { create: { status: OrderStatus.PROCESSING, notes: 'Imported from marketplace' } },
      },
    });

    return await this.prisma.marketplaceOrderImport.update({
      where: { id: importRecord.id },
      data: { orderId: order.id, status: MarketplaceImportStatus.IMPORTED },
    });
  }
}
