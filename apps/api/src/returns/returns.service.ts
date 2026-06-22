import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReturnStatus, RefundMethod, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { CreateReturnDto } from './dto/create-return.dto.js';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto.js';

/**
 * Allowed transitions for the ReturnRequest state machine.
 * Keys are the current status; values are the statuses that may be transitioned to.
 */
const ALLOWED_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.REQUESTED]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  [ReturnStatus.APPROVED]: [ReturnStatus.INSPECTION, ReturnStatus.REJECTED, ReturnStatus.RESOLVED],
  [ReturnStatus.INSPECTION]: [ReturnStatus.RESOLVED, ReturnStatus.REJECTED],
  [ReturnStatus.RESOLVED]: [ReturnStatus.CLOSED],
  [ReturnStatus.REJECTED]: [ReturnStatus.CLOSED],
  [ReturnStatus.CLOSED]: [],
};

export interface CreateReturnInput extends CreateReturnDto {
  orderId: string;
  userId?: string;
}

export interface ListReturnsFilter {
  status?: ReturnStatus;
  orderId?: string;
  userId?: string;
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

    this.assertWithinReturnWindow(order.updatedAt);

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

    return created;
  }

  async listReturns(filter: ListReturnsFilter = {}) {
    const where: Prisma.ReturnRequestWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.userId) where.userId = filter.userId;

    return this.prisma.returnRequest.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
  }

  async getReturn(id: string) {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true },
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
    if (to === ReturnStatus.RESOLVED) {
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

    return updated;
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
