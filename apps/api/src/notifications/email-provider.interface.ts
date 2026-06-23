/**
 * Port abstraction for email providers.
 *
 * Core code depends on this port, not on a specific transport (Resend, Loops,
 * SendGrid, etc.). The concrete adapter is selected in {@link EmailModule}.
 */
export abstract class EmailProvider {
  /**
   * Send a templated email.
   *
   * @param to Recipient email address.
   * @param template Template identifier (e.g. 'sri-invoice-delivery').
   * @param vars Key/value variables to render the template.
   */
  abstract sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
  ): Promise<void>;
}
