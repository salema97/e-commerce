import { Injectable, Logger } from '@nestjs/common';
import type { EmailTemplate } from '@repo/shared-types';
import { renderEmailTemplate } from '@repo/shared-utils';
import {
  EmailProvider,
  type SendEmailTemplateOptions,
} from '../email-provider.interface.js';

/**
 * MVP console-only email provider.
 *
 * Logs the rendered email to the console instead of contacting a real email
 * service. This is useful for local development and early integration tests
 * before a transactional email provider is configured.
 */
@Injectable()
export class ConsoleEmailProvider extends EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
    options?: SendEmailTemplateOptions,
  ): Promise<void> {
    const rendered = renderEmailTemplate(template as EmailTemplate, {
      customerName: vars.customerName ?? 'Cliente',
      orderNumber: vars.orderNumber ?? '',
      total: vars.total ?? '',
      carrier: vars.carrier ?? '',
      trackingNumber: vars.trackingNumber ?? '',
      trackingUrl: vars.trackingUrl,
      retryUrl: vars.retryUrl,
      amount: vars.amount ?? '',
      refundMethod: vars.refundMethod ?? '',
      documentTypeLabel: vars.documentType ?? vars.documentTypeLabel ?? 'documento',
      accessKey: vars.accessKey ?? '',
      pdfUrl: vars.pdfUrl ?? '',
      xmlUrl: vars.xmlUrl ?? '',
    });

    this.logger.log(
      {
        to,
        template,
        subject: options?.subject ?? rendered.subject,
        attachmentCount: options?.attachments?.length ?? 0,
      },
      'Console email provider would send templated email',
    );
  }
}
