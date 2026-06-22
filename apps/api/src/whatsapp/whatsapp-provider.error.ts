/**
 * Base error for WhatsApp provider failures.
 */
export class WhatsAppProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly providerCode?: string,
  ) {
    super(message);
    this.name = 'WhatsAppProviderError';
  }
}
