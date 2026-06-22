import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { UpdateInventoryDto } from './dto/update-inventory.dto.js';

const inventoryInclude = {
  product: { select: { id: true, name: true, slug: true } },
  variant: { select: { id: true, name: true, sku: true } },
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.findOne(id);
    return this.prisma.inventory.update({
      where: { id },
      data,
      include: inventoryInclude,
    });
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
}
