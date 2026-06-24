export abstract class ProductAnalyticsProvider {
  abstract capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void>;

  abstract isFeatureEnabled(flag: string, distinctId: string): Promise<boolean>;
}
