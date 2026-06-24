import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountingSyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AccountingProviderFactory } from './accounting.factory.js';

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: AccountingProviderFactory,
  ) {}

  listProfiles() {
    return this.factory.listProfiles();
  }

  listSyncRecords(limit = 100) {
    return this.prisma.accountingSyncRecord.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async listMarketplaceFeeReconciliations() {
    const provider = this.factory.getProvider();
    const orders = await this.prisma.order.findMany({
      where: {
        marketplaceChannel: { not: null },
        marketplaceFees: { not: null, gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        marketplaceChannel: true,
        marketplaceExternalId: true,
        marketplaceFees: true,
        total: true,
        createdAt: true,
      },
    });

    const synced = await this.prisma.accountingSyncRecord.findMany({
      where: {
        provider: provider.provider,
        resourceType: 'marketplace_fee',
        resourceId: { in: orders.map((o) => o.id) },
      },
    });
    const syncedByOrder = new Map(synced.map((r) => [r.resourceId, r]));

    return orders.map((order) => {
      const record = syncedByOrder.get(order.id);
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        channel: order.marketplaceChannel,
        externalOrderId: order.marketplaceExternalId,
        fees: Number(order.marketplaceFees),
        orderTotal: Number(order.total),
        syncStatus: record?.status ?? 'PENDING',
        syncedAt: record?.syncedAt?.toISOString() ?? null,
      };
    });
  }

  async syncMarketplaceFee(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (!order.marketplaceChannel || order.marketplaceFees == null) {
      throw new NotFoundException(`Order ${orderId} has no marketplace fees to reconcile`);
    }

    const provider = this.factory.getProvider();
    const result = await provider.pushMarketplaceFee({
      orderId: order.id,
      channel: order.marketplaceChannel,
      fees: Number(order.marketplaceFees),
      orderTotal: Number(order.total),
      externalOrderId: order.marketplaceExternalId,
    });

    await this.upsertSyncRecord(
      provider.provider,
      'marketplace_fee',
      order.id,
      result.externalId,
      result.status,
    );
  }

  async syncAuthorizedInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const provider = this.factory.getProvider();
    const order = invoice.order;

    const customerResult = await provider.pushCustomer({
      externalRef: order.userId ?? order.customerEmail,
      name: order.customerName ?? order.customerEmail,
      email: order.customerEmail,
      taxId: order.customerIdentification,
    });

    await this.upsertSyncRecord(provider.provider, 'customer', order.id, customerResult.externalId, customerResult.status);

    const invoiceResult = await provider.pushInvoice({
      invoiceId: invoice.id,
      orderId: order.id,
      authorizationNumber: invoice.authorizationNumber,
      accessKey: invoice.accessKey,
      total: Number(order.total),
      customer: {
        externalRef: order.userId ?? order.customerEmail,
        name: order.customerName ?? order.customerEmail,
        email: order.customerEmail,
        taxId: order.customerIdentification,
      },
    });

    await this.upsertSyncRecord(provider.provider, 'invoice', invoice.id, invoiceResult.externalId, invoiceResult.status);
  }

  private async upsertSyncRecord(
    provider: string,
    resourceType: string,
    resourceId: string,
    externalId: string,
    status: AccountingSyncStatus,
  ) {
    await this.prisma.accountingSyncRecord.upsert({
      where: {
        provider_resourceType_resourceId: {
          provider: provider as never,
          resourceType,
          resourceId,
        },
      },
      create: {
        provider: provider as never,
        resourceType,
        resourceId,
        externalId,
        status,
        syncedAt: status === AccountingSyncStatus.SYNCED ? new Date() : null,
      },
      update: {
        externalId,
        status,
        syncedAt: status === AccountingSyncStatus.SYNCED ? new Date() : null,
        lastError: null,
      },
    });
  }
}
