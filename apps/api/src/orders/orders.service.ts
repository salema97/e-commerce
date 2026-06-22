import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { PromotionService } from '../promotions/promotion.service.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto.js';
import { OrderChannel, OrderStatus } from '@prisma/client';

export interface CreatedOrderResult {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel: OrderChannel;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  reservationExpiresAt: Date;
  items: Array<{ productId: string; variantId?: string; name: string; sku: string; price: number; quantity: number }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationService: InventoryReservationService,
    private readonly promotionService: PromotionService,
    private readonly notificationService: WhatsAppNotificationService,
  ) {}

  async createOrder(userId: string | undefined, dto: CreateOrderDto): Promise<CreatedOrderResult> {
    const channel = dto.channel ?? OrderChannel.WEB;
    const customerEmail = userId ? (await this.prisma.user.findUnique({ where: { id: userId } }))?.email ?? dto.customerEmail : dto.customerEmail;
    if (!customerEmail) throw new BadRequestException('customerEmail required for guest orders');
    if (!dto.items?.length) throw new BadRequestException('Order must contain at least one item');

    // Validate coupon BEFORE reserving inventory so an invalid code fails fast without
    // holding stock. Final totals are computed via PromotionService (tax + discount).
    if (dto.couponCode) {
      await this.promotionService.validateCoupon(dto.couponCode, dto.items);
    }

    const reservationItems = await this.validateItems(dto.items);
    await this.reservationService.reserveItems(reservationItems);

    const orderItems = await this.buildOrderItems(dto.items);
    const totals = await this.promotionService.calculateOrderTotals(
      orderItems.map((i) => ({ productId: i.productId, variantId: i.variantId ?? undefined, price: Number(i.price), quantity: i.quantity })),
      dto.couponCode,
    );

    const subtotal = new Prisma.Decimal(totals.subtotal);
    const taxAmount = new Prisma.Decimal(totals.taxAmount);
    const shippingAmount = new Prisma.Decimal(totals.shipping);
    const discountAmount = new Prisma.Decimal(totals.discount);
    const total = new Prisma.Decimal(totals.total);
    const orderNumber = this.generateOrderNumber();
    const reservationExpiresAt = this.reservationService.reservationExpiry();

    const order = await this.prisma.order.create({
      data: {
        orderNumber, userId, customerEmail, customerPhone: dto.customerPhone,
        status: OrderStatus.PAYMENT_PENDING, channel, couponCode: dto.couponCode,
        subtotal, taxAmount, shippingAmount, discountAmount, total,
        shippingAddress: (dto.shippingAddress as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        billingAddress: (dto.billingAddress as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        reservationExpiresAt,
        items: { createMany: { data: orderItems } },
        statusHistory: { create: { status: OrderStatus.PAYMENT_PENDING, notes: 'Order created' } },
      },
      include: { items: true },
    });

    if (dto.couponCode) {
      await this.promotionService.incrementCouponUsage(dto.couponCode);
    }

    return {
      id: order.id, orderNumber: order.orderNumber, status: order.status, channel: order.channel,
      subtotal: Number(order.subtotal), taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount), discountAmount: Number(order.discountAmount),
      total: Number(order.total), couponCode: order.couponCode ?? undefined,
      reservationExpiresAt: order.reservationExpiresAt!,
      items: (order as typeof order & { items: Array<{ productId: string; variantId: string | null; name: string; sku: string; price: Prisma.Decimal; quantity: number }> }).items.map((i) => ({
        productId: i.productId, variantId: i.variantId ?? undefined, name: i.name, sku: i.sku, price: Number(i.price), quantity: i.quantity,
      })),
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true, statusHistory: true } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    await this.getOrderById(id);
    await this.prisma.order.update({
      where: { id },
      data: { status, statusHistory: { create: { status, notes: 'Status updated by admin' } } },
    });
    await this.notifyStatusChange(id, status);
    return { id, status };
  }

  async cancelOrder(id: string, userId?: string) {
    const order = await this.getOrderById(id);
    if (userId && order.userId && order.userId !== userId) {
      throw new ForbiddenException("Cannot cancel another user's order");
    }
    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING];
    if (!cancellable.includes(order.status)) throw new BadRequestException(`Cannot cancel order in status ${order.status}`);
    await this.reservationService.release(id);
    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, statusHistory: { create: { status: OrderStatus.CANCELLED, notes: 'Order cancelled' } } },
    });
    return { id, status: OrderStatus.CANCELLED };
  }

  private async validateItems(items: CreateOrderItemDto[]) {
    return Promise.all(items.map(async (item) => {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      if (item.variantId && !product.variants.some((v) => v.id === item.variantId)) {
        throw new BadRequestException(`Variant ${item.variantId} not found for product ${item.productId}`);
      }
      return { productId: item.productId, variantId: item.variantId, quantity: item.quantity };
    }));
  }

  private async buildOrderItems(items: CreateOrderItemDto[]) {
    return Promise.all(items.map(async (item) => {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      const variant = product.variants.find((v) => v.id === item.variantId);
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: product.name,
        sku: variant?.sku ?? product.sku ?? 'N/A',
        price: new Prisma.Decimal(item.price),
        quantity: item.quantity,
      };
    }));
  }

  private async notifyStatusChange(id: string, status: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { whatsappOptOut: true } } },
    });

    if (!order || !order.customerPhone) {
      return;
    }

    const phone = order.customerPhone;
    const customerName = 'Cliente';
    const total = `USD ${Number(order.total).toFixed(2)}`;

    try {
      if (status === OrderStatus.PROCESSING) {
        await this.notificationService.notify(id, 'ORDER_CONFIRMED', phone, {
          customerName,
          orderNumber: order.orderNumber,
          total,
        });
      } else if (status === OrderStatus.SHIPPED) {
        await this.notificationService.notify(id, 'ORDER_SHIPPED', phone, {
          customerName,
          orderNumber: order.orderNumber,
          carrier: 'Transportista asignado',
          trackingNumber: 'Pendiente',
        });
      } else if (status === OrderStatus.DELIVERED) {
        await this.notificationService.notify(id, 'ORDER_DELIVERED', phone, {
          customerName,
          orderNumber: order.orderNumber,
        });
      }
    } catch {
      // Notifications are best-effort and must not fail the status update.
    }
  }

  private generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}
