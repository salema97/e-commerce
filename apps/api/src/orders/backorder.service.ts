import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderItemFulfillmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService, ReservationItem } from '../inventory/inventory-reservation.service.js';

export interface ItemAllocation {
  productId: string;
  variantId?: string | null;
  quantity: number;
  quantityReserved: number;
  quantityBackordered: number;
  fulfillmentStatus: OrderItemFulfillmentStatus;
}

@Injectable()
export class BackorderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly reservationService: InventoryReservationService,
  ) {}

  isEnabled(): boolean {
    return this.config.get('ALLOW_BACKORDERS') === 'true';
  }

  async allocateItems(items: ReservationItem[]): Promise<ItemAllocation[]> {
    const allocations: ItemAllocation[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { allowBackorder: true },
      });
      const inventory = await this.prisma.inventory.findFirst({
        where: { productId: item.productId, variantId: item.variantId ?? null },
      });

      const available = inventory
        ? Math.max(0, inventory.quantity - inventory.reservedQuantity)
        : 0;
      const canBackorder = this.isEnabled() && Boolean(product?.allowBackorder);

      if (available < item.quantity && !canBackorder) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }

      const quantityReserved = Math.min(item.quantity, available);
      const quantityBackordered = item.quantity - quantityReserved;
      const fulfillmentStatus =
        quantityBackordered > 0
          ? OrderItemFulfillmentStatus.BACKORDERED
          : OrderItemFulfillmentStatus.ALLOCATED;

      allocations.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        quantityReserved,
        quantityBackordered,
        fulfillmentStatus,
      });
    }

    const reservable = allocations
      .filter((item) => item.quantityReserved > 0)
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantityReserved,
      }));

    if (reservable.length) {
      await this.reservationService.reserveItems(reservable);
    }

    return allocations;
  }
}
