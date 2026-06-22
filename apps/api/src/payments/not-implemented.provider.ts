import {
  CreatePaymentIntentOptions,
  PaymentIntentResult,
  PaymentProvider,
  PaymentResult,
  RefundResult,
} from './payment-provider.interface.js';

export abstract class NotImplementedPaymentProvider extends PaymentProvider {
  private notImplemented(): never {
    throw new Error(`${this.constructor.name} is not implemented`);
  }

  async createPaymentIntent(): Promise<PaymentIntentResult> {
    this.notImplemented();
  }

  async confirmPayment(): Promise<PaymentResult> {
    this.notImplemented();
  }

  async refund(): Promise<RefundResult> {
    this.notImplemented();
  }

  validateWebhookSignature(): boolean {
    this.notImplemented();
  }
}
