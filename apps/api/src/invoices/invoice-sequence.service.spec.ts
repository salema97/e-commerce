import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { InvoiceSequenceService } from './invoice-sequence.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('InvoiceSequenceService', () => {
  let service: InvoiceSequenceService;
  let counter: number;
  let max: number;

  beforeEach(async () => {
    counter = 0;
    max = Number.POSITIVE_INFINITY;

    const prisma = {
      $queryRawUnsafe: vi.fn(async () => {
        if (counter >= max) {
          return [];
        }
        counter += 1;
        return [{ currentNumber: counter }];
      }),
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        InvoiceSequenceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InvoiceSequenceService);
  });

  it('allocates a zero-padded 9-digit sequence number', async () => {
    const number = await service.allocateNext('01', '001', '001');

    expect(number).toBe('000000001');
    expect(counter).toBe(1);
  });

  it('allocates a zero-padded 9-digit sequence number for credit notes', async () => {
    const number = await service.allocateNext('04', '001', '001');

    expect(number).toBe('000000001');
  });

  it('returns unique sequential numbers under concurrent allocation', async () => {
    const allocations = await Promise.all(
      Array.from({ length: 20 }, () => service.allocateNext('01', '001', '001')),
    );

    const numeric = allocations.map((n) => Number.parseInt(n, 10));
    const unique = new Set(numeric);

    expect(unique.size).toBe(20);
    expect(Math.min(...numeric)).toBe(1);
    expect(Math.max(...numeric)).toBe(20);
  });

  it('throws when the authorized sequence range is exhausted', async () => {
    max = 0;

    await expect(
      service.allocateNext('01', '001', '001'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
