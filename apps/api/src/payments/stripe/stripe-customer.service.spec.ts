import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeCustomerService } from './stripe-customer.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

function createStripeMock() {
  return {
    customers: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('StripeCustomerService', () => {
  let service: StripeCustomerService;
  let stripeMock: ReturnType<typeof createStripeMock>;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    stripeMock = createStripeMock();
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        StripeCustomerService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'sk_test_xxx' },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(StripeCustomerService);
    (service as unknown as { stripe: typeof stripeMock }).stripe = stripeMock;
  });

  it('creates a Stripe customer and stores the id when user has none', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_123',
      stripeCustomerId: null,
    });
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_123' });
    prisma.user.update.mockResolvedValue({ id: 'user_123', stripeCustomerId: 'cus_123' });

    const result = await service.createOrUpdateCustomer(
      'user_123',
      'customer@example.com',
      'John Doe',
    );

    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      email: 'customer@example.com',
      name: 'John Doe',
      metadata: { userId: 'user_123' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: { stripeCustomerId: 'cus_123' },
    });
    expect(result).toBe('cus_123');
  });

  it('updates existing Stripe customer when user already has one', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_123',
      stripeCustomerId: 'cus_existing',
    });
    stripeMock.customers.update.mockResolvedValue({ id: 'cus_existing' });

    const result = await service.createOrUpdateCustomer(
      'user_123',
      'new@example.com',
      'Jane Doe',
    );

    expect(stripeMock.customers.update).toHaveBeenCalledWith('cus_existing', {
      email: 'new@example.com',
      name: 'Jane Doe',
    });
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(result).toBe('cus_existing');
  });

  it('returns undefined and does not throw when Stripe create fails', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_123',
      stripeCustomerId: null,
    });
    stripeMock.customers.create.mockRejectedValue(new Error('Stripe down'));

    const result = await service.createOrUpdateCustomer(
      'user_123',
      'customer@example.com',
    );

    expect(result).toBeUndefined();
  });

  it('creates an ephemeral customer for guest checkout', async () => {
    stripeMock.customers.create.mockResolvedValue({ id: 'cus_guest' });

    const result = await service.findOrCreateEphemeralCustomer('guest@example.com');

    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      email: 'guest@example.com',
      metadata: { ephemeral: 'true' },
    });
    expect(result).toBe('cus_guest');
  });
});
