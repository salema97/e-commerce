import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuditLogEvent {
  actorClerkUserId: string;
  resource: string;
  action: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

interface AuditDiff {
  before: unknown;
  after: unknown;
  changedFields: string[];
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditLogEvent): Promise<void> {
    try {
      const diff = this.buildDiff(event.before, event.after);
      await this.prisma.auditLog.create({
        data: {
          actorClerkUserId: event.actorClerkUserId,
          resource: event.resource,
          action: event.action,
          resourceId: event.resourceId ?? null,
          diff: (diff === null
            ? Prisma.JsonNull
            : (diff as unknown as Prisma.InputJsonValue)),
          metadata: (event.metadata
            ? (event.metadata as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull),
        },
      });
    } catch (error) {
      this.logger.error(
        { error, resource: event.resource, action: event.action },
        'Failed to write audit log',
      );
    }
  }

  private buildDiff(before: unknown, after: unknown): AuditDiff | null {
    const serializedBefore = this.serialize(before);
    const serializedAfter = this.serialize(after);

    if (serializedBefore === null && serializedAfter === null) {
      return null;
    }

    const changedFields = this.computeChangedFields(
      serializedBefore,
      serializedAfter,
    );

    return {
      before: serializedBefore,
      after: serializedAfter,
      changedFields,
    };
  }

  private serialize(value: unknown): Record<string, unknown> | null {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private computeChangedFields(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): string[] {
    if (before === null && after !== null) {
      return Object.keys(after);
    }

    if (before !== null && after === null) {
      return Object.keys(before);
    }

    if (before === null || after === null) {
      return [];
    }

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Array.from(allKeys).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    );
  }
}
