import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { Prisma, TaxCategory } from '@prisma/client';
import { validateAddress } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { PromotionService } from '../promotions/promotion.service.js';
import { ShippingService } from '../shipping/shipping.service.js';
import { TaxService } from '../tax/tax.service.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from '../notifications/email-notification.service.js';
import { PushNotificationService } from '../notifications/push-notification.service.js';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto.js';
import { OrderChannel, OrderStatus, ShippingMethodType } from '@prisma/client';
import { FulfillmentSource } from '@prisma/client';
import { BackorderService, type ItemAllocation } from './backorder.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { CaptchaService } from '../common/captcha/captcha.service.js';

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
  items: Array<{ productId: string; variantId?: string; name: string; sku: string; price: number; quantity: number; taxRate?: number; taxAmount?: number; discountAmount?: number }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationService: InventoryReservationService,
    private readonly promotionService: PromotionService,
    private readonly shippingService: ShippingService,
    private readonly taxService: TaxService,
    private readonly backorderService: BackorderService,
    private readonly notificationService: WhatsAppNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly loyaltyService: LoyaltyService,
    private readonly captchaService: CaptchaService,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {}

  async createOrder(userId: string | undefined, dto: CreateOrderDto): Promise<CreatedOrderResult> {
    const channel = dto.channel ?? OrderChannel.WEB;
    const shippingMethod = dto.shippingMethod ?? ShippingMethodType.DELIVERY;
    const customerProfile = await this.resolveCustomerProfile(userId, dto);
    if (!customerProfile.email) throw new BadRequestException('customerEmail required for guest orders');
    if (!dto.items?.length) throw new BadRequestException('Order must contain at least one item');

    await this.captchaService.verifyOrSkip(channel === OrderChannel.POS ? undefined : dto.captchaToken);

    if (shippingMethod === ShippingMethodType.PICKUP) {
      if (!dto.pickupLocationId) {
        throw new BadRequestException('pickupLocationId is required for pickup orders');
      }
      const location = await this.prisma.storeLocation.findFirst({
        where: { id: dto.pickupLocationId, isActive: true, supportsPickup: true },
      });
      if (!location) {
        throw new BadRequestException('Pickup location not found or unavailable');
      }
    }

    if (dto.shippingAddress) {
      const addressErrors = validateAddress(dto.shippingAddress);
      if (addressErrors.length > 0) {
        throw new BadRequestException(addressErrors.join('; '));
      }
    }

    // Validate coupon BEFORE reserving inventory so an invalid code fails fast without
    // holding stock. Final totals are computed via PromotionService (tax + discount).
    if (dto.couponCode) {
      await this.promotionService.validateCoupon(dto.couponCode, dto.items);
    }

    const reservationItems = await this.validateItems(dto.items);
    let allocations;
    if (this.backorderService.isEnabled()) {
      allocations = await this.backorderService.allocateItems(reservationItems);
    } else {
      await this.reservationService.reserveItems(reservationItems);
    }

    const cartItems = dto.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      price: item.price,
      quantity: item.quantity,
    }));

    const discountTotals = await this.promotionService.computeDiscountTotals(
      cartItems,
      dto.couponCode,
    );

    let loyaltyDiscount = 0;
    let loyaltyPointsRedeemed = 0;
    if (userId && dto.loyaltyPointsToRedeem && dto.loyaltyPointsToRedeem > 0) {
      const quote = await this.loyaltyService.quoteRedemption(
        userId,
        discountTotals.subtotal - discountTotals.discount,
        dto.loyaltyPointsToRedeem,
      );
      loyaltyPointsRedeemed = quote.points;
      loyaltyDiscount = quote.discountAmount;
    }

    const shippingAddress = dto.shippingAddress as Record<string, string> | undefined;
    const taxCategories = await this.loadTaxCategories(dto.items);

    let loyaltyFreeShipping = false;
    if (userId) {
      const loyaltyAccount = await this.loyaltyService.getOrCreateAccount(userId);
      loyaltyFreeShipping = this.loyaltyService.hasFreeShippingBenefit(loyaltyAccount.tier);
    }

    const taxResult = await this.taxService.calculateForCart({
      items: cartItems,
      taxCategories,
      orderDiscount: discountTotals.discount + loyaltyDiscount,
      country: shippingAddress?.country,
      province: shippingAddress?.state,
    });
    const shippingQuote =
      shippingMethod === ShippingMethodType.DELIVERY
        ? await this.shippingService.quote({
            country: shippingAddress?.country,
            province: shippingAddress?.state,
            subtotal: discountTotals.subtotal - discountTotals.discount - loyaltyDiscount,
            freeShipping: discountTotals.freeShipping || loyaltyFreeShipping,
          })
        : { amount: 0, carrier: shippingMethod, estimatedDays: 0 };

    const totals = {
      subtotal: discountTotals.subtotal,
      discount: discountTotals.discount + loyaltyDiscount,
      taxAmount: taxResult.taxAmount,
      shipping: shippingQuote.amount,
      total: Number(
        (
          discountTotals.subtotal -
          discountTotals.discount -
          loyaltyDiscount +
          taxResult.taxAmount +
          shippingQuote.amount
        ).toFixed(2),
      ),
      couponCode: discountTotals.couponCode,
      promotionId: discountTotals.promotionId,
    };

    const orderItems = await this.buildOrderItems(dto.items, totals, taxResult.lines, allocations);

    const subtotal = new Prisma.Decimal(totals.subtotal);
    const taxAmount = new Prisma.Decimal(totals.taxAmount);
    const shippingAmount = new Prisma.Decimal(totals.shipping);
    const discountAmount = new Prisma.Decimal(totals.discount);
    const total = new Prisma.Decimal(totals.total);
    const orderNumber = this.generateOrderNumber();
    const reservationExpiresAt = this.reservationService.reservationExpiry();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: customerProfile.email,
        customerPhone: dto.customerPhone,
        customerName: customerProfile.name,
        customerIdentification: customerProfile.identification,
        customerAddress: customerProfile.address,
        status: OrderStatus.PAYMENT_PENDING,
        channel,
        shippingMethod,
        pickupLocationId: dto.pickupLocationId,
        posRegisterId: dto.posRegisterId,
        couponCode: dto.couponCode,
        referralCode: dto.referralCode,
        loyaltyPointsRedeemed,
        companyId: dto.companyId,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        netPaymentTerms: dto.netPaymentTerms,
        notes: dto.notes,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        total,
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

    if (userId && loyaltyPointsRedeemed > 0) {
      await this.loyaltyService.redeem(userId, loyaltyPointsRedeemed, order.id);
    }

    return {
      id: order.id, orderNumber: order.orderNumber, status: order.status, channel: order.channel,
      subtotal: Number(order.subtotal), taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount), discountAmount: Number(order.discountAmount),
      total: Number(order.total), couponCode: order.couponCode ?? undefined,
      reservationExpiresAt: order.reservationExpiresAt!,
      items: (order as typeof order & { items: Array<{ productId: string; variantId: string | null; name: string; sku: string; price: Prisma.Decimal; quantity: number; taxRate: Prisma.Decimal; taxAmount: Prisma.Decimal; discountAmount: Prisma.Decimal }> }).items.map((i) => ({
        productId: i.productId, variantId: i.variantId ?? undefined, name: i.name, sku: i.sku, price: Number(i.price), quantity: i.quantity,
        taxRate: Number(i.taxRate), taxAmount: Number(i.taxAmount), discountAmount: Number(i.discountAmount),
      })),
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, statusHistory: true, shipments: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async getOrderTracking(id: string) {
    const order = await this.getOrderById(id);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shipments: order.shipments,
    };
  }


  async listOrders(query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const where = query.status ? { status: query.status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.serializeOrderSummary(order)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private serializeOrderSummary(
    order: {
      id: string;
      orderNumber: string;
      userId: string | null;
      customerEmail: string;
      customerPhone: string | null;
      customerName: string | null;
      status: OrderStatus;
      channel: OrderChannel;
      subtotal: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      shippingAmount: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      total: Prisma.Decimal;
      createdAt: Date;
      updatedAt: Date;
      items: unknown[];
    },
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      status: order.status,
      channel: order.channel,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items,
    };
  }

  async markReadyForPickup(id: string) {
    const order = await this.getOrderById(id);
    if (order.shippingMethod !== ShippingMethodType.PICKUP) {
      throw new BadRequestException('Order is not a pickup order');
    }
    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.READY_FOR_PICKUP,
        pickupReadyAt: new Date(),
        statusHistory: {
          create: { status: OrderStatus.READY_FOR_PICKUP, notes: 'Ready for in-store pickup' },
        },
      },
    });
    await this.notifyPickupReady(id);
    return { id, status: OrderStatus.READY_FOR_PICKUP };
  }

  async confirmPickup(id: string) {
    const order = await this.getOrderById(id);
    if (order.shippingMethod !== ShippingMethodType.PICKUP) {
      throw new BadRequestException('Order is not a pickup order');
    }
    return this.updateOrderStatus(id, OrderStatus.DELIVERED);
  }

  private async notifyPickupReady(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupLocation: true,
        user: { select: { whatsappOptOut: true, emailOptOut: true } },
      },
    });
    if (!order) return;

    const context = {
      customerName: order.customerName ?? 'Cliente',
      orderNumber: order.orderNumber,
      pickupLocation: order.pickupLocation?.name ?? 'Tienda',
      pickupAddress: order.pickupLocation?.address ?? '',
    };

    try {
      if (order.customerPhone) {
        await this.notificationService.notify(orderId, 'PICKUP_READY', order.customerPhone, context);
      }
      if (order.customerEmail) {
        await this.emailNotificationService.notify(orderId, 'PICKUP_READY', order.customerEmail, context);
      }
      await this.pushNotificationService.notifyForOrder(
        orderId,
        order.userId,
        'PICKUP_READY',
        context,
      );
    } catch {
      // best-effort
    }
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

  private validateItems(items: CreateOrderItemDto[]) {
    return Promise.all(items.map(async (item) => {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      if (product.isPreOrder && product.preOrderReleaseDate && product.preOrderReleaseDate > new Date()) {
        // Pre-orders allowed before release; fulfillment waits until release date.
      }
      if (item.variantId && !product.variants.some((v) => v.id === item.variantId)) {
        throw new BadRequestException(`Variant ${item.variantId} not found for product ${item.productId}`);
      }
      return { productId: item.productId, variantId: item.variantId, quantity: item.quantity };
    }));
  }

  private async resolveCustomerProfile(
    userId: string | undefined,
    dto: CreateOrderDto,
  ): Promise<{ email: string | undefined; name?: string; identification?: string; address?: string }> {
    let email = dto.customerEmail;
    let name = dto.customerName;
    let identification = dto.customerIdentification;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, identification: true },
      });
      if (user) {
        email = user.email ?? email;
        name = name ?? user.name ?? undefined;
        identification = identification ?? user.identification ?? undefined;
      }
    }

    const address = dto.customerAddress ?? this.formatAddress(dto.billingAddress) ?? this.formatAddress(dto.shippingAddress);

    return { email, name, identification, address };
  }

  private formatAddress(address?: Record<string, unknown>): string | undefined {
    if (!address) return undefined;
    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
    ].filter((v): v is string => typeof v === 'string' && v.length > 0);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  private async loadTaxCategories(items: CreateOrderItemDto[]): Promise<Map<string, TaxCategory>> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, taxCategory: true },
    });
    return new Map(products.map((product) => [product.id, product.taxCategory]));
  }

  private async buildOrderItems(
    items: CreateOrderItemDto[],
    totals: { subtotal: number; discount: number; taxAmount: number },
    taxLines: Array<{ productId: string; taxRate: number; taxAmount: number }>,
    allocations?: ItemAllocation[],
  ) {
    const allocationMap = new Map(
      allocations?.map((item) => [
        `${item.productId}:${item.variantId ?? ''}`,
        item,
      ]),
    );

    const productItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true, supplier: true, seller: true },
        });
        if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
        const variant = product.variants.find((v) => v.id === item.variantId);
        const allocation = allocationMap.get(`${item.productId}:${item.variantId ?? ''}`);
        const lineGross = Number(variant?.price ?? product.price) * item.quantity;
        let fulfillmentSource: FulfillmentSource = FulfillmentSource.WAREHOUSE;
        if (product.supplier?.dropshipEnabled) {
          fulfillmentSource = FulfillmentSource.DROPSHIP;
        } else if (product.sellerId && product.seller?.status === 'ACTIVE') {
          fulfillmentSource = FulfillmentSource.SELLER;
        }
        const sellerCommissionRate = product.seller ? Number(product.seller.commissionRate) : 0;
        const dropshipCommissionRate = product.supplier?.dropshipCommissionRate
          ? Number(product.supplier.dropshipCommissionRate)
          : 0;
        const sellerCommissionAmount =
          fulfillmentSource === FulfillmentSource.SELLER
            ? Number(((lineGross * sellerCommissionRate) / 100).toFixed(2))
            : null;
        const dropshipCommissionAmount =
          fulfillmentSource === FulfillmentSource.DROPSHIP
            ? Number(((lineGross * dropshipCommissionRate) / 100).toFixed(2))
            : null;
        return {
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: product.name,
          sku: variant?.sku ?? product.sku ?? 'N/A',
          price: new Prisma.Decimal(item.price),
          quantity: item.quantity,
          quantityBackordered: allocation?.quantityBackordered ?? 0,
          fulfillmentStatus: allocation?.fulfillmentStatus,
          fulfillmentSource,
          supplierId: product.supplierId,
          sellerId: product.sellerId,
          sellerCommissionAmount:
            sellerCommissionAmount != null ? new Prisma.Decimal(sellerCommissionAmount) : null,
          dropshipCommissionAmount:
            dropshipCommissionAmount != null ? new Prisma.Decimal(dropshipCommissionAmount) : null,
        };
      }),
    );

    return this.allocateItemTotals(productItems, totals, taxLines);
  }

  private allocateItemTotals(
    items: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      sku: string;
      price: Prisma.Decimal;
      quantity: number;
      quantityBackordered?: number;
      fulfillmentStatus?: ItemAllocation['fulfillmentStatus'];
      fulfillmentSource?: FulfillmentSource;
      supplierId?: string | null;
      sellerId?: string | null;
      sellerCommissionAmount?: Prisma.Decimal | null;
      dropshipCommissionAmount?: Prisma.Decimal | null;
    }>,
    totals: { subtotal: number; discount: number; taxAmount: number },
    taxLines: Array<{ productId: string; taxRate: number; taxAmount: number }>,
  ) {
    const lineSubtotals = items.map((i) => Number(i.price) * i.quantity);
    const subtotal = lineSubtotals.reduce((sum, v) => sum + v, 0);

    let remainingDiscount = totals.discount;

    const allocated = items.map((item, index) => {
      const lineSubtotal = lineSubtotals[index];
      const isLast = index === items.length - 1;

      const discount = isLast
        ? remainingDiscount
        : Number(
            new Prisma.Decimal(
              subtotal > 0 ? (lineSubtotal / subtotal) * totals.discount : 0,
            ).toFixed(2),
          );

      remainingDiscount = Number(
        new Prisma.Decimal(remainingDiscount).minus(discount).toFixed(2),
      );

      const taxLine = taxLines[index];

      return {
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        quantityBackordered: item.quantityBackordered ?? 0,
        fulfillmentStatus: item.fulfillmentStatus,
        fulfillmentSource: item.fulfillmentSource,
        supplierId: item.supplierId,
        sellerId: item.sellerId,
        sellerCommissionAmount: item.sellerCommissionAmount,
        dropshipCommissionAmount: item.dropshipCommissionAmount,
        taxRate: new Prisma.Decimal(taxLine?.taxRate ?? 15),
        taxAmount: new Prisma.Decimal(taxLine?.taxAmount ?? 0),
        discountAmount: new Prisma.Decimal(discount),
      };
    });

    return allocated;
  }

  private async notifyStatusChange(id: string, status: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { whatsappOptOut: true, emailOptOut: true } } },
    });

    if (!order) {
      return;
    }

    const phone = order.customerPhone;
    const customerName = 'Cliente';
    const total = `USD ${Number(order.total).toFixed(2)}`;

    try {
      if (status === OrderStatus.PROCESSING) {
        void this.eventBus.publish({ name: 'order.paid', payload: { orderId: id } });
      } else if (status === OrderStatus.SHIPPED) {
        const latestShipment = await this.prisma.shipment.findFirst({
          where: { orderId: id },
          orderBy: { createdAt: 'desc' },
        });
        const context = {
          customerName,
          orderNumber: order.orderNumber,
          carrier: latestShipment?.carrier ?? 'Transportista asignado',
          trackingNumber: latestShipment?.trackingNumber ?? 'Pendiente',
          trackingUrl: latestShipment?.trackingUrl ?? undefined,
        };
        if (phone) {
          await this.notificationService.notify(id, 'ORDER_SHIPPED', phone, context);
        }
        if (order.customerEmail) {
          await this.emailNotificationService.notify(
            id,
            'ORDER_SHIPPED',
            order.customerEmail,
            context,
          );
        }
        await this.pushNotificationService.notifyForOrder(
          id,
          order.userId,
          'ORDER_SHIPPED',
          context,
        );
        void this.eventBus.publish({ name: 'order.shipped', payload: { orderId: id } });
      } else if (status === OrderStatus.DELIVERED) {
        const context = {
          customerName,
          orderNumber: order.orderNumber,
        };
        if (phone) {
          await this.notificationService.notify(id, 'ORDER_DELIVERED', phone, context);
        }
        if (order.customerEmail) {
          await this.emailNotificationService.notify(
            id,
            'ORDER_DELIVERED',
            order.customerEmail,
            context,
          );
        }
        await this.pushNotificationService.notifyForOrder(
          id,
          order.userId,
          'ORDER_DELIVERED',
          context,
        );
      }
    } catch {
      // Notifications are best-effort and must not fail the status update.
    }
  }

  private generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}
