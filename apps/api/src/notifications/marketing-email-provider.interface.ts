export type MarketingEventName =
  | 'purchase_completed'
  | 'win_back_sent'
  | 'promo_distributed'
  | 'abandoned_cart'
  | 'back_in_stock';

export interface MarketingContactProfile {
  userId?: string;
  lastOrderAt?: string;
  totalSpent?: number;
  marketingOptOut?: boolean;
  tags?: string[];
}

/**
 * Port for marketing automation providers (Loops, Klaviyo, Mailchimp).
 */
export abstract class MarketingEmailProvider {
  abstract trackEvent(
    email: string,
    event: MarketingEventName | string,
    properties?: Record<string, string | number | boolean | undefined>,
  ): Promise<void>;

  abstract syncContact(email: string, profile: MarketingContactProfile): Promise<void>;
}
