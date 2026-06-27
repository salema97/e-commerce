import { Injectable, Logger } from '@nestjs/common';
import {
  RefundMethod,
  ReturnStatus,
  type ReturnRequest,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailNotificationService } from '../../notifications/email-notification.service.js';
import { WhatsAppNotificationService } from '../../whatsapp/whatsapp-notification.service.js';
import { PushNotificationService } from '../../notifications/push-notification.service.js';
import type { EmailTemplate } from '@repo/shared-types';
import type { WhatsAppTemplate } from '@repo/shared-types';
import type { EmailTemplateContext } from '@repo/shared-utils';
import type { NotificationContext } from '../../whatsapp/whatsapp-templates.js';

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprobada',
  INSPECTION: 'En inspección',
  RESOLVED: 'Resuelta',
  RESOLUTION_PENDING_CREDIT_NOTE: 'Pendiente nota de crédito',
  REJECTED: 'Rechazada',
  CLOSED: 'Cerrada',
};

export interface ReturnNotificationOptions {
  refundAmount?: number;
}

@Injectable()
export class ReturnNotificationService {
  private readonly logger = new Logger(ReturnNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly whatsappNotificationService: WhatsAppNotificationService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async onReturnRequested(req: ReturnRequest): Promise<void> {
    await this.dispatch(req.id, 'RETURN_REQUESTED', async (loaded) => {
      const context = {
        customerName: loaded.customerName,
        orderNumber: loaded.order.orderNumber,
        returnId: req.id,
        reason: req.reason,
      };
      await this.sendChannels(
        loaded,
        'RETURN_REQUESTED',
        'RETURN_REQUESTED',
        context,
        `${req.id}:RETURN_REQUESTED`,
      );
    });
  }

  async onReturnStatusChanged(
    req: ReturnRequest,
    from: ReturnStatus,
    to: ReturnStatus,
    options?: ReturnNotificationOptions,
  ): Promise<void> {
    if (from === to) {
      return;
    }

    if (
      to === ReturnStatus.RESOLVED &&
      req.refundMethod === RefundMethod.ORIGINAL_PAYMENT &&
      options?.refundAmount !== undefined
    ) {
      await this.dispatch(req.id, 'REFUND_CONFIRMED', async (loaded) => {
        const context = {
          customerName: loaded.customerName,
          orderNumber: loaded.order.orderNumber,
          amount: `USD ${options.refundAmount!.toFixed(2)}`,
          refundMethod: 'Método original de pago',
        };
        await this.sendChannels(
          loaded,
          'REFUND_CONFIRMED',
          'REFUND_CONFIRMED',
          context,
          `${req.id}:REFUND_CONFIRMED`,
        );
      });
      return;
    }

    if (
      to === ReturnStatus.RESOLVED &&
      req.refundMethod === RefundMethod.STORE_CREDIT &&
      options?.refundAmount !== undefined
    ) {
      await this.dispatch(req.id, 'RETURN_STORE_CREDIT', async (loaded) => {
        const context = {
          customerName: loaded.customerName,
          orderNumber: loaded.order.orderNumber,
          amount: `USD ${options.refundAmount!.toFixed(2)}`,
        };
        await this.sendChannels(
          loaded,
          'RETURN_STORE_CREDIT',
          'RETURN_STORE_CREDIT',
          context,
          `${req.id}:RETURN_STORE_CREDIT`,
        );
      });
      return;
    }

    await this.dispatch(req.id, 'RETURN_STATUS_CHANGED', async (loaded) => {
      const context = {
        customerName: loaded.customerName,
        orderNumber: loaded.order.orderNumber,
        returnId: req.id,
        fromStatus: RETURN_STATUS_LABELS[from] ?? from,
        toStatus: RETURN_STATUS_LABELS[to] ?? to,
      };
      await this.sendChannels(
        loaded,
        'RETURN_STATUS_CHANGED',
        'RETURN_STATUS_CHANGED',
        context,
        `${req.id}:RETURN_STATUS_CHANGED:${to}`,
      );
    });
  }

  private async dispatch(
    returnId: string,
    event: string,
    handler: (loaded: LoadedReturnContext) => Promise<void>,
  ): Promise<void> {
    try {
      const loaded = await this.loadReturnContext(returnId);
      if (!loaded) {
        this.logger.warn({ returnId, event }, 'Return not found for notification');
        return;
      }
      await handler(loaded);
    } catch (error) {
      this.logger.error({ error, returnId, event }, 'Return notification failed');
    }
  }

  private async loadReturnContext(returnId: string): Promise<LoadedReturnContext | null> {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { order: true },
    });
    if (!record || !record.order) {
      return null;
    }
    return {
      order: record.order,
      customerName: record.order.customerName ?? 'Cliente',
      customerEmail: record.order.customerEmail,
      customerPhone: record.order.customerPhone,
      userId: record.order.userId,
    };
  }

  private async sendChannels(
    loaded: LoadedReturnContext,
    emailTemplate: EmailTemplate,
    whatsappTemplate: WhatsAppTemplate,
    context: EmailTemplateContext,
    idempotencySuffix: string,
  ): Promise<void> {
    const orderId = loaded.order.id;
    const idempotencyBase = `${orderId}:${idempotencySuffix}`;

    if (loaded.customerPhone) {
      await this.whatsappNotificationService.notify(
        orderId,
        whatsappTemplate,
        loaded.customerPhone,
        context as NotificationContext,
        { idempotencyKey: `wa:notification:${idempotencyBase}` },
      );
    }

    if (loaded.customerEmail) {
      await this.emailNotificationService.notify(
        orderId,
        emailTemplate,
        loaded.customerEmail,
        context,
        { idempotencyKey: `email:notification:${idempotencyBase}` },
      );
    }

    await this.pushNotificationService.notifyForOrder(
      orderId,
      loaded.userId,
      emailTemplate,
      context,
      { idempotencyKey: `push:notification:${idempotencyBase}` },
    );
  }
}

interface LoadedReturnContext {
  order: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    customerPhone: string | null;
    userId: string | null;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  userId: string | null;
}
