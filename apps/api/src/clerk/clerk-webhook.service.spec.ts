import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClerkWebhookService } from './clerk-webhook.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StripeCustomerService } from '../payments/stripe/stripe-customer.service.js';
import { Role } from '../auth/role.enum.js';

describe('ClerkWebhookService', () => {
  let service: ClerkWebhookService;
  let prisma: { user: { upsert: ReturnType<typeof vi.fn> } };
  let stripeCustomerService: {
    createOrUpdateCustomer: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = { user: { upsert: vi.fn() } };
    stripeCustomerService = { createOrUpdateCustomer: vi.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ClerkWebhookService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeCustomerService, useValue: stripeCustomerService },
      ],
    }).compile();
    service = module.get(ClerkWebhookService);
  });

  it('upserts user and triggers Stripe customer sync on user.created', async () => {
    stripeCustomerService.createOrUpdateCustomer.mockResolvedValue('cus_123');

    await service.handleUserWebhook({
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [{ id: 'email_1', email_address: 'a@b.com' }],
        primary_email_address_id: 'email_1',
        phone_numbers: [{ id: 'phone_1', phone_number: '+593' }],
        primary_phone_number_id: 'phone_1',
        first_name: 'John',
        last_name: 'Doe',
        public_metadata: { role: Role.CUSTOMER },
      },
    } as any);

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkUserId: 'user_123' },
        create: expect.objectContaining({
          clerkUserId: 'user_123',
          email: 'a@b.com',
          phone: '+593',
          role: Role.CUSTOMER,
        }),
      }),
    );
    expect(stripeCustomerService.createOrUpdateCustomer).toHaveBeenCalledWith(
      'user_123',
      'a@b.com',
      'John Doe',
    );
  });

  it('rejects invalid role', async () => {
    await expect(
      service.handleUserWebhook({
        type: 'user.created',
        data: {
          id: 'user_123',
          email_addresses: [{ id: 'email_1', email_address: 'a@b.com' }],
          primary_email_address_id: 'email_1',
          public_metadata: { role: 'hacker' },
        },
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
