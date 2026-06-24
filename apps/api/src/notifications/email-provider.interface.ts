/**
 * Port abstraction for email providers.
 *
 * Core code depends on this port, not on a specific transport (Resend, Loops,
 * SendGrid, etc.). The concrete adapter is selected in {@link EmailModule}.
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailTemplateOptions {
  subject?: string;
  attachments?: EmailAttachment[];
}

export abstract class EmailProvider {
  /**
   * Send a templated email.
   *
   * @param to Recipient email address.
   * @param template Template identifier (e.g. ORDER_CONFIRMED).
   * @param vars Key/value variables to render the template.
   */
  abstract sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
    options?: SendEmailTemplateOptions,
  ): Promise<void>;
}
