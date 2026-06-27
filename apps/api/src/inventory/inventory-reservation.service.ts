import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ReservationItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class InventoryReservationService {
  private static readonly DEFAULT_TTL_MINUTES = 30;
  constructor(private readonly prisma: PrismaService) {}

  reservationExpiry(minutes = InventoryReservationService.DEFAULT_TTL_MINUTES) {
    return new Date(Date.now() + minutes * 60_000);
  }

  async reserve(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    await this.reserveItems(order.items);
  }

  async reserveItems(items: ReservationItem[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await this.reserveItemInTx(tx, item);
      }
    });
  }

  async releaseItems(items: ReservationItem[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await this.releaseItemInTx(tx, item);
      }
    });
  }

  async release(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    await this.adjust(order.items, (qty) => ({ reservedQuantity: { decrement: qty } }));
  }

  async confirm(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    await this.adjust(order.items, (qty) => ({ quantity: { decrement: qty }, reservedQuantity: { decrement: qty } }));
  }

  async releaseExpiredReservations(before = new Date()): Promise<number> {
    const expired = await this.prisma.order.findMany({
      where: { status: OrderStatus.PAYMENT_PENDING, reservationExpiresAt: { lt: before } },
      select: { id: true },
    });

    for (const { id } of expired) {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return;

        for (const item of order.items) {
          await this.releaseItemInTx(tx, {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }

        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            statusHistory: { create: { status: OrderStatus.CANCELLED, notes: 'Reservation expired' } },
          },
        });
      });
    }

    return expired.length;
  }

  async cancelOrderReservation(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new NotFoundException(`Order ${orderId} not found`);

      for (const item of order.items) {
        await this.releaseItemInTx(tx, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          statusHistory: { create: { status: OrderStatus.CANCELLED, notes: 'Order cancelled' } },
        },
      });
    });
  }

  private async reserveItemInTx(tx: TransactionClient, item: ReservationItem): Promise<void> {
    const inv = await tx.inventory.findFirst({
      where: { productId: item.productId, variantId: item.variantId ?? null },
    });
    if (!inv) {
      throw new BadRequestException(`No inventory for product ${item.productId}`);
    }

    const updatedRows = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
      WHERE "id" = ${inv.id}
        AND "quantity" - "reservedQuantity" >= ${item.quantity}
    `;

    if (Number(updatedRows) === 0) {
      throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
    }
  }

  private async releaseItemInTx(tx: TransactionClient, item: ReservationItem): Promise<void> {
    const inv = await tx.inventory.findFirst({
      where: { productId: item.productId, variantId: item.variantId ?? null },
    });
    if (!inv) return;

    const releaseQty = Math.min(item.quantity, inv.reservedQuantity);
    if (releaseQty <= 0) return;

    await tx.inventory.update({
      where: { id: inv.id },
      data: { reservedQuantity: { decrement: releaseQty } },
    });
  }

  private async adjust(
    items: Array<{ productId: string; variantId: string | null; quantity: number }>,
    build: (qty: number) => object,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventory.findFirst({
          where: { productId: item.productId, variantId: item.variantId ?? null },
        });
        if (!inv) continue;
        const qty = Math.min(item.quantity, inv.reservedQuantity);
        if (qty <= 0) continue;
        await tx.inventory.update({ where: { id: inv.id }, data: build(qty) });
      }
    });
  }
}
