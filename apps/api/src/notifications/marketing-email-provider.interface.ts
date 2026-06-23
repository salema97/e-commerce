/**
 * Port for marketing automation providers (Klaviyo, Mailchimp, Loops).
 */
export abstract class MarketingEmailProvider {
  abstract trackEvent(
    email: string,
    event: string,
    properties?: Record<string, string | number | boolean>,
  ): Promise<void>;
}
