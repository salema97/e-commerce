export enum PaymentWebhookEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  CHARGE_REFUNDED = 'charge.refunded',
}

export class PaymentWebhookResponseDto {
  received!: boolean;
}
