import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Invoice, CreditNote, Order } from '@prisma/client';
import { EmailProvider } from '../../notifications/email-provider.interface.js';
import { StorageService } from '../../storage/storage.service.js';
import { WhatsAppNotificationService } from '../../whatsapp/whatsapp-notification.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type DeliveryStatus = 'DELIVERED' | 'FAILED' | 'PENDING' | 'SKIPPED';

/**
 * Orchestrates delivery of authorized SRI documents to customers via WhatsApp
 * and email. Uses signed R2 URLs so documents remain private.
 */
@Injectable()
export class SriDeliveryService {
  private readonly logger = new Logger(SriDeliveryService.name);

  constructor(
    private readonly whatsapp: WhatsAppNotificationService,
    private readonly email: EmailProvider,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async deliverInvoice(invoice: Invoice, order: Order): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(
        { invoiceId: invoice.id },
        'SRI document delivery is disabled',
      );
      return;
    }

    const documentTypeLabel = invoice.documentType === '04' ? 'nota de credito' : 'factura';
    const result = await this.attemptDelivery({
      documentId: invoice.id,
      documentTypeLabel,
      accessKey: invoice.accessKey,
      order,
      buildKeys: () => ({
        xmlKey: `sri/invoices/${invoice.id}/invoice.xml`,
        pdfKey: `sri/invoices/${invoice.id}/ride.pdf`,
      }),
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        deliveryStatus: result.status,
        deliveredAt: result.status === 'DELIVERED' ? new Date() : null,
        deliveryError: result.error ?? null,
      },
    });
  }

  async deliverCreditNote(creditNote: CreditNote, order: Order): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(
        { creditNoteId: creditNote.id },
        'SRI document delivery is disabled',
      );
      return;
    }

    const result = await this.attemptDelivery({
      documentId: creditNote.id,
      documentTypeLabel: 'nota de credito',
      accessKey: creditNote.accessKey,
      order,
      buildKeys: () => ({
        xmlKey: `sri/credit-notes/${creditNote.id}/credit-note.xml`,
        pdfKey: `sri/credit-notes/${creditNote.id}/ride.pdf`,
      }),
    });

    await this.prisma.creditNote.update({
      where: { id: creditNote.id },
      data: {
        deliveryStatus: result.status,
        deliveredAt: result.status === 'DELIVERED' ? new Date() : null,
        deliveryError: result.error ?? null,
      },
    });
  }

  private async attemptDelivery(options: {
    documentId: string;
    documentTypeLabel: string;
    accessKey: string;
    order: Order;
    buildKeys: () => { xmlKey: string; pdfKey: string };
  }): Promise<{ status: DeliveryStatus; error?: string }> {
    const { xmlKey, pdfKey } = options.buildKeys();

    let pdfUrl: string | undefined;
    let xmlUrl: string | undefined;

    try {
      [pdfUrl, xmlUrl] = await Promise.all([
        this.storage.getSignedUrl(pdfKey),
        this.storage.getSignedUrl(xmlKey),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate signed URLs';
      this.logger.error(
        { documentId: options.documentId, error: message },
        'Failed to generate signed document URLs',
      );
      return { status: 'FAILED', error: message };
    }

    const phone = options.order.customerPhone;
    const email = options.order.customerEmail;

    if (!phone && !email) {
      return {
        status: 'SKIPPED',
        error: 'No customer phone or email available for delivery',
      };
    }

    const errors: string[] = [];
    let delivered = false;

    if (phone) {
      try {
        await this.whatsapp.notify(
          options.order.id,
          'SRI_DOCUMENT_DELIVERY',
          phone,
          {
            customerName: options.order.customerEmail.split('@')[0],
            documentTypeLabel: options.documentTypeLabel,
            accessKey: options.accessKey,
            pdfUrl: pdfUrl!,
            xmlUrl: xmlUrl!,
          },
        );
        delivered = true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'WhatsApp delivery failed';
        this.logger.error(
          { documentId: options.documentId, error: message },
          'WhatsApp document delivery failed',
        );
        errors.push(message);
      }
    }

    if (email) {
      try {
        await this.email.sendTemplate(email, 'SRI_DOCUMENT_DELIVERY', {
          customerName: options.order.customerEmail.split('@')[0],
          documentTypeLabel: options.documentTypeLabel,
          orderNumber: options.order.orderNumber,
          accessKey: options.accessKey,
          pdfUrl: pdfUrl!,
          xmlUrl: xmlUrl!,
        });
        delivered = true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Email delivery failed';
        this.logger.error(
          { documentId: options.documentId, error: message },
          'Email document delivery failed',
        );
        errors.push(message);
      }
    }

    if (delivered) {
      return { status: 'DELIVERED' };
    }

    return {
      status: errors.length > 0 ? 'FAILED' : 'PENDING',
      error: errors.join('; ') || undefined,
    };
  }

  private isEnabled(): boolean {
    return this.config.get<string>('SRI_DELIVERY_ENABLED') !== 'false';
  }
}
