import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, OrderStatus, RefundStatus, PaymentStatus, PaymentProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { InvoiceProviderFactory } from '../invoices/invoice-provider.factory.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { RefundResult } from './payment-provider.interface.js';

export type RefundType = 'full' | 'partial';

export interface CreateRefundInput {
  orderId: string;
  amount: number;
  type: RefundType;
  requestedById?: string;
  reason?: string;
  returnRequestId?: string;
  parentInvoiceAccessKey?: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  paymentId: string | null;
  providerRefundId: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  type: RefundType;
  requestedById: string | null;
  approvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly invoiceProviderFactory: InvoiceProviderFactory,
    private readonly auditLog: AuditLogService,
  ) {}

  async createRefund(input: CreateRefundInput): Promise<RefundRecord> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: true, invoice: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    if (input.type === 'full' && Math.abs(input.amount - Number(order.total)) > 0.01) {
      throw new BadRequestException(
        `Full refund amount must match order total ${order.total}`,
      );
    }

    if (input.type === 'partial' && input.amount >= Number(order.total)) {
      throw new BadRequestException(
        `Partial refund amount must be less than order total ${order.total}`,
      );
    }

    const payment = this.selectRefundablePayment(order.payments);
    if (!payment) {
      throw new BadRequestException(
        `No completed payment found for order ${input.orderId}`,
      );
    }

    if (input.amount > Number(payment.amount)) {
      throw new BadRequestException(
        `Refund amount ${input.amount} exceeds captured payment ${payment.amount}`,
      );
    }

    const provider = this.providerFactory.getProvider(payment.provider as PaymentProvider);
    let providerResult: RefundResult;
    try {
      providerResult = await provider.refund(
        payment.providerTransactionId ?? payment.id,
        input.amount,
      );
    } catch (error) {
      this.logger.error({ error, orderId: input.orderId }, 'Provider refund failed');
      throw new BadRequestException('Refund failed at payment provider');
    }

    const refund = await this.prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        returnRequestId: input.returnRequestId ?? null,
        providerRefundId: providerResult.providerRefundId,
        amount: new Prisma.Decimal(input.amount),
        reason: input.reason ?? `${input.type} refund`,
        status: providerResult.status,
        requestedById: input.requestedById ?? null,
        providerMetadata: { type: input.type } as unknown as Prisma.InputJsonValue,
      },
    });

    const newOrderStatus =
      input.type === 'full' ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED;
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: newOrderStatus,
        statusHistory: {
          create: {
            status: newOrderStatus,
            notes: `Refund ${refund.id} (${input.type}) ${providerResult.status}`,
          },
        },
      },
    });

    if (payment.status !== PaymentStatus.REFUNDED && input.type === 'full') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    if (input.parentInvoiceAccessKey) {
      await this.issueCreditNoteForRefund(
        input.parentInvoiceAccessKey,
        refund.id,
        input,
      );
    } else {
      this.logger.log(
        { orderId: order.id, returnRequestId: input.returnRequestId ?? null },
        input.returnRequestId
          ? 'Return-request refund without invoice access key: skipping SRI credit note'
          : 'Standalone refund: skipping SRI credit note',
      );
    }

    if (input.requestedById) {
      await this.auditLog.log({
        actorClerkUserId: input.requestedById,
        resource: 'Refund',
        action: 'CREATE',
        resourceId: refund.id,
        after: {
          orderId: order.id,
          amount: input.amount,
          type: input.type,
          status: providerResult.status,
        },
      });
    }

    return this.toRefundRecord(refund);
  }

  async approveRefund(refundId: string, approvedById: string): Promise<RefundRecord> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund ${refundId} not found`);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException(
        `Refund ${refundId} cannot be approved from status ${refund.status}`,
      );
    }

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        approvedById,
        status: RefundStatus.COMPLETED,
      },
    });

    await this.auditLog.log({
      actorClerkUserId: approvedById,
      resource: 'Refund',
      action: 'APPROVE',
      resourceId: refundId,
      before: { status: refund.status },
      after: { status: RefundStatus.COMPLETED, approvedById },
    });

    return this.toRefundRecord(updated);
  }

  async listRefunds(orderId: string): Promise<RefundRecord[]> {
    const refunds = await this.prisma.refund.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return refunds.map((r) => this.toRefundRecord(r));
  }

  private selectRefundablePayment(
    payments: Array<{
      id: string;
      provider: string;
      status: PaymentStatus;
      amount: Prisma.Decimal;
      providerTransactionId: string | null;
    }>,
  ) {
    return (
      payments.find(
        (p) => p.status === PaymentStatus.COMPLETED || p.status === PaymentStatus.REFUNDED,
      ) ?? null
    );
  }

  private async issueCreditNoteForRefund(
    invoiceAccessKey: string,
    refundId: string,
    input: CreateRefundInput,
  ): Promise<void> {
    const provider = this.invoiceProviderFactory.getProvider();
    await provider.issueCreditNote({
      returnRequestId: input.returnRequestId ?? '',
      invoiceAccessKey,
      parentInvoiceAccessKey: invoiceAccessKey,
      authorizationNumber: undefined,
      codDocModificado: '01',
      numDocModificado: invoiceAccessKey,
      fechaEmisionDocumentoModificado: this.formatDate(new Date()),
      reason: input.reason ?? `${input.type} refund`,
      items: [],
      total: input.amount,
    });
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private toRefundRecord(r: {
    id: string;
    orderId: string;
    paymentId: string | null;
    providerRefundId: string | null;
    amount: Prisma.Decimal;
    reason: string;
    status: RefundStatus;
    requestedById: string | null;
    approvedById: string | null;
    providerMetadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): RefundRecord {
    const metadata = (r.providerMetadata ?? {}) as { type?: RefundType };
    return {
      id: r.id,
      orderId: r.orderId,
      paymentId: r.paymentId,
      providerRefundId: r.providerRefundId,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      type: metadata.type ?? (Math.abs(Number(r.amount)) > 0 ? 'partial' : 'partial'),
      requestedById: r.requestedById,
      approvedById: r.approvedById,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
