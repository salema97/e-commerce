import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { EmailTemplate } from '@repo/shared-types';
import { renderEmailTemplate, type EmailTemplateContext } from '@repo/shared-utils';
import {
  EmailProvider,
  type SendEmailTemplateOptions,
} from '../email-provider.interface.js';

@Injectable()
export class ResendEmailProvider extends EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.fromEmail =
      this.config.get<string>('TRANSACTIONAL_EMAIL_FROM') ??
      this.config.get<string>('SRI_EMAIL_FROM') ??
      'noreply@example.com';
  }

  async sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
    options?: SendEmailTemplateOptions,
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
    }

    const client = new Resend(apiKey);
    const rendered = renderEmailTemplate(
      template as EmailTemplate,
      vars as unknown as EmailTemplateContext,
    );

    const { error } = await client.emails.send({
      from: this.fromEmail,
      to,
      subject: options?.subject ?? rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: options?.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    if (error) {
      this.logger.error({ to, template, error }, 'Resend email send failed');
      throw new Error(error.message);
    }
  }
}
