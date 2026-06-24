import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { UpdateInventoryDto } from './dto/update-inventory.dto.js';
import {
  InventoryReservationService,
  ReservationItem,
} from './inventory-reservation.service.js';
import { BackInStockAlertsService } from '../notifications/back-in-stock-alerts.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';

const inventoryInclude = {
  product: { select: { id: true, name: true, slug: true } },
  variant: { select: { id: true, name: true, sku: true } },
};

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationService: InventoryReservationService,
    private readonly backInStockAlerts: BackInStockAlertsService,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {}

  create(data: CreateInventoryDto) {
    return this.prisma.inventory.create({
      data: {
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity ?? 0,
        reservedQuantity: data.reservedQuantity ?? 0,
        lowStockThreshold: data.lowStockThreshold,
      },
      include: inventoryInclude,
    });
  }

  findAll() {
    return this.prisma.inventory.findMany({
      include: inventoryInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: inventoryInclude,
    });
    if (!inventory) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
    return inventory;
  }

  async update(id: string, data: UpdateInventoryDto) {
    const before = await this.findOne(id);
    const beforeAvailable = before.quantity - before.reservedQuantity;

    const updated = await this.prisma.inventory.update({
      where: { id },
      data,
      include: inventoryInclude,
    });

    const afterAvailable = updated.quantity - updated.reservedQuantity;
    if (beforeAvailable <= 0 && afterAvailable > 0) {
      await this.backInStockAlerts.notifyRestocked(updated.productId).catch(() => undefined);
    }

    void this.eventBus.publish({
      name: 'inventory.changed',
      payload: { inventoryId: id, productId: updated.productId, quantity: updated.quantity },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.inventory.delete({ where: { id }, include: inventoryInclude });
  }

  async reserve(id: string, quantity: number) {
    const inventory = await this.findOne(id);
    const available = inventory.quantity - inventory.reservedQuantity;

    if (quantity > available) {
      throw new BadRequestException(
        `Cannot reserve ${quantity} units. Only ${available} available.`,
      );
    }

    return this.prisma.inventory.update({
      where: { id },
      data: { reservedQuantity: { increment: quantity } },
      include: inventoryInclude,
    });
  }

  async release(id: string, quantity: number) {
    const inventory = await this.findOne(id);
    const releasable = Math.min(quantity, inventory.reservedQuantity);

    return this.prisma.inventory.update({
      where: { id },
      data: { reservedQuantity: { decrement: releasable } },
      include: inventoryInclude,
    });
  }

  reserveItems(items: ReservationItem[]): Promise<void> {
    return this.reservationService.reserveItems(items);
  }

  releaseOrderReservation(orderId: string): Promise<void> {
    return this.reservationService.release(orderId);
  }

  confirmOrderReservation(orderId: string): Promise<void> {
    return this.reservationService.confirm(orderId);
  }
}
