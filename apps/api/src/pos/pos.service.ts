import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { OrderChannel, OrderStatus, PaymentProvider, PaymentStatus, Prisma, ShippingMethodType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { InventoryReservationService } from '../inventory/inventory-reservation.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { ReceiptService } from '../receipts/receipt.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';
import {
  CreatePosOrderDto,
  CreatePosRegisterDto,
  CreateStoreLocationDto,
  UpdatePosRegisterDto,
  UpdateStoreLocationDto,
} from './dto/pos.dto.js';
import { PaymentProvider as PaymentProviderEnum } from '../payments/payment-provider.enum.js';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly reservationService: InventoryReservationService,
    private readonly invoicesService: InvoicesService,
    private readonly receiptService: ReceiptService,
    private readonly paymentsService: PaymentsService,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {}

  listLocations(pickupOnly = false) {
    return this.prisma.storeLocation.findMany({
      where: {
        isActive: true,
        ...(pickupOnly ? { supportsPickup: true } : {}),
      },
      include: { registers: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  }

  createLocation(dto: CreateStoreLocationDto) {
    return this.prisma.storeLocation.create({ data: dto });
  }

  updateLocation(id: string, dto: UpdateStoreLocationDto) {
    return this.prisma.storeLocation.update({ where: { id }, data: dto });
  }

  listRegisters(locationId?: string) {
    return this.prisma.posRegister.findMany({
      where: {
        isActive: true,
        ...(locationId ? { locationId } : {}),
      },
      include: { location: true },
      orderBy: [{ locationId: 'asc' }, { code: 'asc' }],
    });
  }

  createRegister(dto: CreatePosRegisterDto) {
    return this.prisma.posRegister.create({ data: dto });
  }

  updateRegister(id: string, dto: UpdatePosRegisterDto) {
    return this.prisma.posRegister.update({ where: { id }, data: dto });
  }

  closeRegister(id: string) {
    return this.prisma.posRegister.update({
      where: { id },
      data: { lastClosedAt: new Date() },
    });
  }

  async createPosOrder(dto: CreatePosOrderDto) {
    const register = await this.prisma.posRegister.findUnique({
      where: { id: dto.posRegisterId },
      include: { location: true },
    });
    if (!register?.isActive) {
      throw new BadRequestException('POS register not found or inactive');
    }
    if (!register.location.isActive || !register.location.supportsPos) {
      throw new BadRequestException('Store location does not support POS sales');
    }

    const items = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        const variant = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)
          : undefined;
        if (item.variantId && !variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found`);
        }
        const price = Number(variant?.price ?? product.price);
        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price,
        };
      }),
    );

    const order = await this.ordersService.createOrder(undefined, {
      items,
      channel: OrderChannel.POS,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerIdentification: dto.customerIdentification,
      notes: dto.notes,
      shippingMethod: ShippingMethodType.POS_IMMEDIATE,
      posRegisterId: dto.posRegisterId,
    });

    if (dto.paymentProvider === 'CASH') {
      const receipt = await this.completeCashPayment(order.id);
      return { order, receipt, paymentStatus: PaymentStatus.COMPLETED };
    }

    const payment = await this.paymentsService.createPaymentIntent(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Math.round(order.total * 100),
        currency: 'USD',
        customerEmail: dto.customerEmail,
        provider: PaymentProviderEnum.STRIPE,
      },
      undefined,
    );

    return { order, payment, paymentStatus: PaymentStatus.PENDING };
  }

  async completeCashPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.channel !== OrderChannel.POS) {
      throw new BadRequestException('Only POS orders support cash completion');
    }
    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException(`Order is not pending payment (${order.status})`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId,
          provider: PaymentProvider.CASH,
          providerTransactionId: `cash-${orderId}`,
          idempotencyKey: `pos-cash-${orderId}`,
          amount: order.total,
          currency: 'USD',
          status: PaymentStatus.COMPLETED,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING, paymentProvider: 'CASH' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PROCESSING,
          notes: 'POS cash payment recorded',
        },
      });
    });

    await this.reservationService.confirm(orderId);
    void this.eventBus.publish({ name: 'order.paid', payload: { orderId } });
    this.invoicesService.enqueueInvoiceForOrder(orderId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message, orderId }, 'Failed to enqueue SRI invoice for POS order');
    });

    return this.receiptService.generateReceipt(orderId);
  }
}
