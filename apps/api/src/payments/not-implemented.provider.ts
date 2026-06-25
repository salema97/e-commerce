import {
  CreatePaymentIntentOptions,
  PaymentIntentResult,
  PaymentOrder,
  PaymentProvider,
  PaymentResult,
  ProviderPaymentResult,
  RefundResult,
  CheckoutSessionResult,
} from './payment-provider.interface.js';

export abstract class NotImplementedPaymentProvider extends PaymentProvider {
  private notImplemented(): never {
    throw new Error(`${this.constructor.name} is not implemented`);
  }

  createPaymentIntent(): Promise<PaymentIntentResult> {
    this.notImplemented();
  }

  createCheckoutSession(): Promise<CheckoutSessionResult> {
    this.notImplemented();
  }

  capturePayment(): Promise<void> {
    this.notImplemented();
  }

  confirmPayment(): Promise<PaymentResult> {
    this.notImplemented();
  }

  refund(): Promise<RefundResult> {
    this.notImplemented();
  }

  validateWebhookSignature(): boolean {
    this.notImplemented();
  }

  parseWebhookPayload(): Promise<ProviderPaymentResult> {
    this.notImplemented();
  }
}
