import { Injectable } from '@nestjs/common';
import type { AnalyticsEventInput } from '@repo/shared-types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnalyticsEventStore } from './analytics-event-store.interface.js';

@Injectable()
export class PrismaAnalyticsEventStore extends AnalyticsEventStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async record(input: AnalyticsEventInput & { createdAt?: Date }): Promise<void> {
    await this.prisma.analyticsEventRecord.create({
      data: {
        event: input.event,
        source: input.source ?? 'api',
        userId: input.userId,
        sessionId: input.sessionId,
        properties: (input.properties ?? undefined) as Prisma.InputJsonValue | undefined,
        createdAt: input.createdAt,
      },
    });
  }

  async recordDomainEvent(name: string, payload: Record<string, unknown>): Promise<void> {
    await this.prisma.analyticsEventRecord.create({
      data: {
        event: name,
        source: 'domain',
        properties: payload as Prisma.InputJsonValue,
      },
    });
  }
}
