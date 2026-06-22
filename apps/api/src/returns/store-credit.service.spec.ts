import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { StoreCreditService } from './store-credit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('StoreCreditService', () => {
  let service: StoreCreditService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  function buildPrismaMock() {
    const txClient = {
      storeCredit: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    return {
      storeCredit: { findFirst: vi.fn() },
      $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) =>
        cb(txClient),
      ),
      __txClient: txClient,
    };
  }

  beforeEach(async () => {
    prisma = buildPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        StoreCreditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(StoreCreditService);
  });

  describe('issue', () => {
    it('creates a new ledger row on first issue', async () => {
      prisma.__txClient.storeCredit.findFirst.mockResolvedValue(null);
      prisma.__txClient.storeCredit.create.mockResolvedValue({
        id: 'sc1',
        userId: 'u1',
        balance: new Prisma.Decimal(25),
        currency: 'USD',
        expiresAt: null,
      });

      const result = await service.issue({ userId: 'u1', amount: 25 });

      expect(result.balance).toBe(25);
      expect(result.currency).toBe('USD');
      expect(prisma.__txClient.storeCredit.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          balance: new Prisma.Decimal(25),
          currency: 'USD',
        }),
      }));
    });

    it('atomically increments an existing ledger row', async () => {
      prisma.__txClient.storeCredit.findFirst.mockResolvedValue({
        id: 'sc1',
        userId: 'u1',
        balance: new Prisma.Decimal(25),
        currency: 'USD',
        expiresAt: null,
      });
      prisma.__txClient.storeCredit.update.mockResolvedValue({
        id: 'sc1',
        userId: 'u1',
        balance: new Prisma.Decimal(75),
        currency: 'USD',
        expiresAt: null,
      });

      const result = await service.issue({ userId: 'u1', amount: 50 });

      expect(result.balance).toBe(75);
      expect(prisma.__txClient.storeCredit.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sc1' },
        data: { balance: { increment: new Prisma.Decimal(50) } },
      }));
    });

    it('rejects non-positive amounts', async () => {
      await expect(
        service.issue({ userId: 'u1', amount: 0 }),
      ).rejects.toThrow();
      await expect(
        service.issue({ userId: 'u1', amount: -5 }),
      ).rejects.toThrow();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('respects explicit currency when issuing', async () => {
      prisma.__txClient.storeCredit.findFirst.mockResolvedValue(null);
      prisma.__txClient.storeCredit.create.mockResolvedValue({
        id: 'sc2',
        userId: 'u1',
        balance: new Prisma.Decimal(10),
        currency: 'EUR',
        expiresAt: null,
      });
      const result = await service.issue({ userId: 'u1', amount: 10, currency: 'EUR' });
      expect(result.currency).toBe('EUR');
      expect(prisma.__txClient.storeCredit.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', currency: 'EUR' } }),
      );
    });
  });

  describe('balance', () => {
    it('returns the persisted balance when a ledger exists', async () => {
      prisma.storeCredit.findFirst.mockResolvedValue({
        userId: 'u1',
        balance: new Prisma.Decimal(42.5),
        currency: 'USD',
        expiresAt: null,
      });
      const result = await service.balance('u1');
      expect(result.balance).toBe(42.5);
      expect(result.userId).toBe('u1');
    });

    it('returns a zero balance when no ledger exists yet', async () => {
      prisma.storeCredit.findFirst.mockResolvedValue(null);
      const result = await service.balance('u1');
      expect(result.balance).toBe(0);
      expect(result.currency).toBe('USD');
      expect(result.expiresAt).toBeNull();
    });
  });
});
