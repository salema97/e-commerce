import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface StoreCreditIssueInput {
  userId: string;
  amount: number;
  currency?: string;
  expiresAt?: Date;
  idempotencyKey?: string;
}

export interface StoreCreditBalance {
  userId: string;
  balance: number;
  currency: string;
  expiresAt: Date | null;
}

/**
 * Minimal store-credit ledger. A single row per user holds the running balance;
 * `issue` performs an atomic increment inside a transaction so concurrent calls
 * are safe. The ledger is intentionally simple — full gift-card UX lands in a
 * later phase.
 */
@Injectable()
export class StoreCreditService {
  private readonly logger = new Logger(StoreCreditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically increment the user's store-credit balance. Creates the ledger
   * row on first issue.
   */
  async issue(input: StoreCreditIssueInput): Promise<StoreCreditBalance> {
    if (input.amount <= 0) {
      throw new Error('Store credit issue amount must be positive');
    }

    const currency = input.currency ?? 'USD';

    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.storeCredit.findFirst({
        where: { userId: input.userId, currency },
      });

      if (existing) {
        return tx.storeCredit.update({
          where: { id: existing.id },
          data: { balance: { increment: new Prisma.Decimal(input.amount) } },
        });
      }

      return tx.storeCredit.create({
        data: {
          userId: input.userId,
          balance: new Prisma.Decimal(input.amount),
          currency,
          expiresAt: input.expiresAt ?? null,
        },
      });
    });

    this.logger.log(
      { userId: input.userId, amount: input.amount, currency },
      'Store credit issued',
    );

    return this.toBalance(record);
  }

  /**
   * Read the user's active store-credit balance. Returns a zero balance when no
   * ledger row exists yet.
   */
  async balance(userId: string, currency = 'USD'): Promise<StoreCreditBalance> {
    const record = await this.prisma.storeCredit.findFirst({
      where: { userId, currency },
    });

    if (!record) {
      return { userId, balance: 0, currency, expiresAt: null };
    }

    return this.toBalance(record);
  }

  private toBalance(record: {
    userId: string;
    balance: Prisma.Decimal;
    currency: string;
    expiresAt: Date | null;
  }): StoreCreditBalance {
    return {
      userId: record.userId,
      balance: Number(record.balance),
      currency: record.currency,
      expiresAt: record.expiresAt,
    };
  }
}
