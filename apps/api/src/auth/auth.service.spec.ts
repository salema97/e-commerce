import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { AppJwtService } from './jwt.service.js';
import { StripeCustomerService } from '../payments/stripe/stripe-customer.service.js';
import { Role } from './role.enum.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    authSession: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };
  let passwords: { hash: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let jwt: { signAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: vi.fn(), create: vi.fn() },
      authSession: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    passwords = {
      hash: vi.fn().mockResolvedValue('hash'),
      verify: vi.fn(),
    };
    jwt = {
      signAccessToken: vi.fn().mockReturnValue('access-token'),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwords },
        { provide: AppJwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (key: string, fallback?: string) => (key === 'AUTH_REFRESH_TOKEN_DAYS' ? '30' : fallback) },
        },
        {
          provide: StripeCustomerService,
          useValue: { createOrUpdateCustomer: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      passwordHash: 'hash',
      role: Role.CUSTOMER,
      name: 'User',
      phone: null,
      emailOptOut: false,
      marketingEmailOptOut: false,
      whatsappOptOut: false,
    });
    passwords.verify.mockResolvedValue(true);
    prisma.authSession.create.mockResolvedValue({ id: 'session_1' });

    const result = await service.login({ email: 'user@example.com', password: 'secret' });

    expect(result.user.email).toBe('user@example.com');
    expect(result.tokens.accessToken).toBe('access-token');
    expect(prisma.authSession.create).toHaveBeenCalled();
  });

  it('rejects invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh token on refresh', async () => {
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session_1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user_1', role: Role.CUSTOMER },
    });
    prisma.authSession.update.mockResolvedValue({});
    prisma.authSession.create.mockResolvedValue({ id: 'session_2' });

    const tokens = await service.refresh('refresh-token');

    expect(prisma.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'session_1' } }),
    );
    expect(tokens.accessToken).toBe('access-token');
    expect(prisma.authSession.create).toHaveBeenCalled();
  });

  it('rejects duplicate registration email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('revokes refresh token on logout', async () => {
    prisma.authSession.updateMany.mockResolvedValue({ count: 1 });
    await service.logout('refresh-token');
    expect(prisma.authSession.updateMany).toHaveBeenCalled();
  });
});
