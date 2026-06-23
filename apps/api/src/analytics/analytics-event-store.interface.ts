import type { AnalyticsEventInput } from '@repo/shared-types';

export abstract class AnalyticsEventStore {
  abstract record(input: AnalyticsEventInput & { createdAt?: Date }): Promise<void>;
  abstract recordDomainEvent(name: string, payload: Record<string, unknown>): Promise<void>;
}
