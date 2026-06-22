import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReturnStatus, RefundMethod, OrderStatus, OrderChannel, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { RefundService } from '../payments/refund.service.js';
import { StoreCreditService } from './store-credit.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { ReturnNotificationService } from './notifications/return-notification.service.js';
import { CreateReturnDto } from './dto/create-return.dto.js';
import { CreateGuestReturnRequestDto } from './dto/create-guest-return-request.dto.js';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto.js';
import { ResolveReturnDto } from './dto/resolve-return.dto.js';

/**
 * Allowed transitions for the ReturnRequest state machine.
 * Keys are the current status; values are the statuses that may be transitioned to.
 */
const ALLOWED_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  [ReturnStatus.APPROVED]: [ReturnStatus.INSPECTION, ReturnStatus.REJECTED, ReturnStatus.RESOLVED],
  [ReturnStatus.INSPECTION]: [ReturnStatus.RESOLVED, ReturnStatus.REJECTED, ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE],
  [ReturnStatus.RESOLVED]: [ReturnStatus.CLOSED],
  [ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE]: [ReturnStatus.RESOLVED, ReturnStatus.REJECTED],
  [ReturnStatus.REJECTED]: [ReturnStatus.CLOSED],
  [ReturnStatus.CLOSED]: [],
};

export interface CreateReturnInput extends CreateReturnDto {
  orderId: string;
  userId?: string;
}

export interface CreateGuestReturnInput extends CreateGuestReturnRequestDto {}

export interface ListReturnsFilter {
  status?: ReturnStatus;
  orderId?: string;
  userId?: string;
  customerEmail?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);
  private readonly defaultReturnWindowDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly refundService: RefundService,
    private readonly storeCreditService: StoreCreditService,
    private readonly invoicesService: InvoicesService,
    private readonly notificationService: ReturnNotificationService,
    configService: ConfigService,
  ) {
    const configured = configService.get<number>('RETURN_WINDOW_DAYS');
    this.defaultReturnWindowDays = configured && configured > 0 ? configured : 30;
  }

  /**
   * Create a return request for an order. Validates order ownership, delivery
   * status, and the return window. Snapshots the active return-window setting
   * onto the row so historical returns keep their original policy.
   */
  async createReturnRequest(input: CreateReturnInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    if (input.userId && order.userId && order.userId !== input.userId) {
      throw new ForbiddenException('Cannot request a return for another user order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Order ${input.orderId} cannot be returned from status ${order.status}`,
      );
    }

    this.assertWithinReturnWindow(order.createdAt);

    if (!input.items?.length) {
      throw new BadRequestException('Return request must include at least one item');
    }

    this.validateReturnItemsAgainstOrder(input.items, order.items);

    const created = await this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: order.userId ?? input.userId ?? null,
        reason: input.reason,
        refundMethod: input.refundMethod ?? null,
        returnWindowDays: this.defaultReturnWindowDays,
        status: ReturnStatus.REQUESTED,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId ?? null,
            quantity: item.quantity,
            condition: item.condition ?? null,
            refundValue: item.refundValue !== undefined
              ? new Prisma.Decimal(item.refundValue)
              : null,
          })),
        },
      },
      include: { items: true },
    });

    await this.auditLog.log({
      actorClerkUserId: input.userId ?? 'guest',
      resource: 'ReturnRequest',
      action: 'CREATE',
      resourceId: created.id,
      after: { orderId: order.id, status: created.status, itemCount: created.items.length },
    });

    await this.notificationService.onReturnRequested(created as never);

    return created;
  }

  /**
   * Create a return request for a guest using order id + email verification.
   * Validates that the supplied email matches the order, that the order was
   * paid and delivered, and that the return window has not elapsed.
   */
  async createGuestReturn(input: CreateGuestReturnInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, payments: true, user: { select: { email: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    const expectedEmail = order.customerEmail || order.user?.email;
    if (!expectedEmail || expectedEmail.toLowerCase() !== input.email.toLowerCase()) {
      throw new ForbiddenException('Email does not match order records');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Order ${input.orderId} cannot be returned from status ${order.status}`,
      );
    }

    const hasCompletedPayment = order.payments.some(
      (payment) => payment.status === PaymentStatus.COMPLETED,
    );
    if (!hasCompletedPayment) {
      throw new BadRequestException(
        `Order ${input.orderId} has no completed payment and cannot be returned`,
      );
    }

    this.assertWithinReturnWindow(order.createdAt);

    if (!input.items?.length) {
      throw new BadRequestException('Return request must include at least one item');
    }

    this.validateReturnItemsAgainstOrder(input.items, order.items);

    const created = await this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: order.userId ?? null,
        reason: input.reason,
        refundMethod: input.refundMethod ?? null,
        returnWindowDays: this.defaultReturnWindowDays,
        status: ReturnStatus.REQUESTED,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId ?? null,
            quantity: item.quantity,
            condition: item.condition ?? null,
            refundValue: item.refundValue !== undefined
              ? new Prisma.Decimal(item.refundValue)
              : null,
          })),
        },
      },
      include: { items: true },
    });

    await this.auditLog.log({
      actorClerkUserId: 'guest',
      resource: 'ReturnRequest',
      action: 'CREATE_GUEST',
      resourceId: created.id,
      after: { orderId: order.id, status: created.status, itemCount: created.items.length },
    });

    await this.notificationService.onReturnRequested(created as never);

    return created;
  }

  async listReturns(filter: ListReturnsFilter = {}) {
    const where: Prisma.ReturnRequestWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.customerEmail) {
      where.order = { customerEmail: { contains: filter.customerEmail, mode: 'insensitive' } };
    }

    return this.prisma.returnRequest.findMany({
      where,
      include: { items: true, order: { select: { orderNumber: true, customerEmail: true } }, creditNote: { select: { id: true, accessKey: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
  }

  async getReturn(id: string) {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true, order: { select: { orderNumber: true, customerEmail: true } }, creditNote: { select: { id: true, accessKey: true, status: true } } },
    });
    if (!record) {
      throw new NotFoundException(`Return request ${id} not found`);
    }
    return record;
  }

  /**
   * Apply a state-machine transition. Throws BadRequestException when the
   * transition is not allowed. Audit-logs every transition with a before/after
   * diff. Some transitions carry required side-effects (resolvedAt, approvedById,
   * etc.) that are applied here.
   */
  async updateStatus(
    id: string,
    dto: UpdateReturnStatusDto,
    actorClerkUserId: string,
  ) {
    const current = await this.getReturn(id);
    const from = current.status;
    const to = dto.status;

    if (from === to) {
      throw new BadRequestException(`Return ${id} is already in status ${to}`);
    }

    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid return status transition: ${from} -> ${to}`,
      );
    }

    if (to === ReturnStatus.RESOLVED && !dto.refundMethod) {
      throw new BadRequestException(
        'refundMethod is required when transitioning to RESOLVED',
      );
    }

    const patch: Prisma.ReturnRequestUpdateInput = {
      status: to,
    };

    if (to === ReturnStatus.APPROVED) patch.approvedById = actorClerkUserId;
    if (to === ReturnStatus.REJECTED) patch.rejectedById = actorClerkUserId;
    if (to === ReturnStatus.INSPECTION) patch.inspectedAt = new Date();
    if (to === ReturnStatus.RESOLVED || to === ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE) {
      patch.resolvedAt = new Date();
      if (dto.refundMethod) patch.refundMethod = dto.refundMethod;
      if (dto.creditNoteId) patch.creditNote = { connect: { id: dto.creditNoteId } };
    }
    if (to === ReturnStatus.CLOSED) patch.closedAt = new Date();

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: patch,
      include: { items: true },
    });

    await this.auditLog.log({
      actorClerkUserId,
      resource: 'ReturnRequest',
      action: 'STATUS_CHANGE',
      resourceId: id,
      before: { status: from },
      after: { status: to, refundMethod: dto.refundMethod ?? null, notes: dto.notes ?? null },
      metadata: dto.notes ? { notes: dto.notes } : undefined,
    });

    this.logger.log({ returnId: id, from, to }, 'Return status transition applied');

    await this.notificationService.onReturnStatusChanged(updated as never, from, to);

    return updated;
  }

  /**
   * Resolve a return request that has been inspected. Executes the selected
   * refund method, restocks the returned items, issues an SRI credit note when
   * the original order was invoiced, and moves the request to RESOLVED (or to
   * the RESOLUTION_PENDING_CREDIT_NOTE compensating state on credit-note
   * failure).
   */
  async resolveReturn(
    id: string,
    dto: ResolveReturnDto,
    actorClerkUserId: string,
  ) {
    const current = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: true,
        order: { include: { items: true, invoice: true } },
      },
    });

    if (!current) {
      throw new NotFoundException(`Return request ${id} not found`);
    }

    if (current.status !== ReturnStatus.INSPECTION) {
      throw new BadRequestException(
        `Return ${id} cannot be resolved from status ${current.status}`,
      );
    }

    const totalAmount = this.computeRefundTotal(current.items, current.order.items);

    const basePatch: Prisma.ReturnRequestUpdateInput = {
      refundMethod: dto.refundMethod,
      resolvedAt: new Date(),
    };

    if (dto.refundMethod === RefundMethod.ORIGINAL_PAYMENT) {
      await this.refundService.createRefund({
        orderId: current.order.id,
        amount: totalAmount,
        type: totalAmount >= Number(current.order.total) ? 'full' : 'partial',
        reason: current.reason,
        returnRequestId: current.id,
        requestedById: actorClerkUserId,
        parentInvoiceAccessKey: current.order.invoice?.accessKey,
      });
    } else if (dto.refundMethod === RefundMethod.STORE_CREDIT) {
      if (!current.userId) {
        throw new BadRequestException('Store credit requires a registered customer');
      }
      await this.storeCreditService.issue({
        userId: current.userId,
        amount: totalAmount,
      });
    } else if (dto.refundMethod === RefundMethod.EXCHANGE) {
      const exchangeOrder = await this.createExchangeOrder(current, dto.exchangeProductIds);
      basePatch.exchangeOrder = { connect: { id: exchangeOrder.id } };
    }

    await this.restockItems(current.items);

    let updated = await this.prisma.returnRequest.update({
      where: { id },
      data: { ...basePatch, status: ReturnStatus.RESOLVED },
      include: { items: true },
    });

    // Credit notes for original-payment refunds are issued by RefundService.
    // Store-credit and exchange resolutions still need a credit note when the
    // original order was invoiced.
    if (
      dto.refundMethod !== RefundMethod.ORIGINAL_PAYMENT &&
      current.order.invoice
    ) {
      try {
        await this.invoicesService.issueCreditNote(
          { returnRequestId: current.id, total: String(totalAmount) },
          actorClerkUserId,
          true,
        );
      } catch (error) {
        this.logger.error(
          { error, returnId: id },
          'SRI credit note failed during return resolution',
        );
        updated = await this.prisma.returnRequest.update({
          where: { id },
          data: { status: ReturnStatus.RESOLUTION_PENDING_CREDIT_NOTE },
          include: { items: true },
        });
      }
    }

    await this.auditLog.log({
      actorClerkUserId,
      resource: 'ReturnRequest',
      action: 'RESOLVE',
      resourceId: id,
      before: { status: current.status, refundMethod: current.refundMethod },
      after: {
        status: updated.status,
        refundMethod: dto.refundMethod,
        totalAmount,
        notes: dto.notes ?? null,
      },
      metadata: dto.notes ? { notes: dto.notes } : undefined,
    });

    await this.notificationService.onReturnStatusChanged(
      updated as never,
      current.status,
      updated.status,
    );

    return updated;
  }

  private computeRefundTotal(
    items: Array<{ productId: string; productVariantId: string | null; quantity: number; refundValue: Prisma.Decimal | null }>,
    orderItems: Array<{ productId: string; variantId: string | null; price: Prisma.Decimal }>,
  ): number {
    return items.reduce((sum, item) => {
      const unitPrice = item.refundValue
        ? Number(item.refundValue)
        : Number(
            orderItems.find(
              (oi) =>
                oi.productId === item.productId &&
                oi.variantId === item.productVariantId,
            )?.price ?? 0,
          );
      return sum + unitPrice * item.quantity;
    }, 0);
  }

  private async restockItems(
    items: Array<{ productId: string; productVariantId: string | null; quantity: number }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.productVariantId ?? null,
          },
        });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }
    });
  }

  private async createExchangeOrder(
    returnRequest: {
      id: string;
      orderId: string;
      userId: string | null;
      order: { customerEmail: string; customerPhone: string | null };
      items: Array<{ productId: string; productVariantId: string | null; quantity: number }>;
    },
    exchangeProductIds?: string[],
  ) {
    const fallbackItems: Array<{ productId: string; variantId?: string; quantity: number }> = returnRequest.items.map((item) => ({
      productId: item.productId,
      variantId: item.productVariantId ?? undefined,
      quantity: item.quantity,
    }));

    const replacementItems: Array<{ productId: string; variantId?: string; quantity: number }> = exchangeProductIds?.length
      ? exchangeProductIds.map((id) => ({ productId: id, quantity: 1 }))
      : fallbackItems;

    const orderItems = await Promise.all(
      replacementItems.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        const variant = item.variantId
          ? product?.variants.find((v) => v.id === item.variantId)
          : product?.variants[0];
        return {
          productId: item.productId,
          variantId: variant?.id ?? null,
          name: product?.name ?? 'Exchange item',
          sku: variant?.sku ?? product?.sku ?? `EXC-${item.productId}`,
          price: Number(variant?.price ?? product?.price ?? 0),
          quantity: item.quantity,
        };
      }),
    );

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return this.prisma.order.create({
      data: {
        orderNumber: `EXC-${returnRequest.id.slice(0, 8)}`,
        userId: returnRequest.userId,
        customerEmail: returnRequest.order.customerEmail,
        customerPhone: returnRequest.order.customerPhone,
        status: OrderStatus.PENDING,
        subtotal: new Prisma.Decimal(total),
        taxAmount: new Prisma.Decimal(0),
        shippingAmount: new Prisma.Decimal(0),
        discountAmount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        channel: OrderChannel.WEB,
        items: { create: orderItems },
      },
    });
  }

  private assertWithinReturnWindow(deliveryTimestamp: Date): void {
    const windowDays = this.defaultReturnWindowDays;
    const cutoff = new Date(deliveryTimestamp.getTime() + windowDays * 24 * 60 * 60 * 1000);
    if (cutoff < new Date()) {
      throw new BadRequestException(
        `Return window of ${windowDays} days has elapsed for this order`,
      );
    }
  }

  private validateReturnItemsAgainstOrder(
    items: CreateReturnInput['items'],
    orderItems: Array<{ id: string; productId: string; variantId: string | null; quantity: number }>,
  ): void {
    for (const item of items) {
      const match = orderItems.find(
        (oi) =>
          oi.productId === item.productId &&
          (item.productVariantId === undefined || oi.variantId === item.productVariantId),
      );
      if (!match) {
        throw new BadRequestException(
          `Item productId=${item.productId} not found on order`,
        );
      }
      if (item.quantity > match.quantity) {
        throw new BadRequestException(
          `Return quantity ${item.quantity} exceeds ordered quantity ${match.quantity}`,
        );
      }
    }
  }
}
