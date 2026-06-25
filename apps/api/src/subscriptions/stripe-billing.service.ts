import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeBillingService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(key ?? 'sk_test_placeholder', {
      apiVersion: '2025-06-30.basil',
    });
  }

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('STRIPE_SECRET_KEY'));
  }

  async createSubscriptionCheckout(params: {
    stripePriceId: string;
    customerId?: string;
    customerEmail?: string;
    userId: string;
    planId: string;
  }): Promise<{ url: string; sessionId: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.customerEmail,
      success_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.getOrThrow<string>('STRIPE_CANCEL_URL'),
      subscription_data: {
        metadata: {
          userId: params.userId,
          planId: params.planId,
        },
      },
      metadata: {
        userId: params.userId,
        planId: params.planId,
        subscriptionCheckout: 'true',
      },
    });

    return { url: session.url ?? '', sessionId: session.id };
  }

  async createBillingPortalSession(customerId: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
    });
    return { url: session.url };
  }
}
