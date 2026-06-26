import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { OrderAccessService } from './order-access.service.js';
import { AppJwtService } from '../auth/jwt.service.js';
import { Role } from '../auth/role.enum.js';

describe('OrderAccessService', () => {
  let service: OrderAccessService;
  let jwt: { verifyAccessToken: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    jwt = { verifyAccessToken: vi.fn() };
    const module = await Test.createTestingModule({
      providers: [
        OrderAccessService,
        { provide: AppJwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(OrderAccessService);
  });

  it('allows staff roles', () => {
    expect(() =>
      service.assertOrderAccess(
        { userId: 'other', customerEmail: 'x@example.com' },
        { userId: 'admin', role: Role.ADMIN },
      ),
    ).not.toThrow();
  });

  it('allows customer owner', () => {
    expect(() =>
      service.assertOrderAccess(
        { userId: 'user_1', customerEmail: 'user@example.com' },
        { userId: 'user_1', role: Role.CUSTOMER },
      ),
    ).not.toThrow();
  });

  it('allows guest email for guest orders', () => {
    expect(() =>
      service.assertOrderAccess(
        { userId: null, customerEmail: 'guest@example.com' },
        { guestEmail: 'guest@example.com' },
      ),
    ).not.toThrow();
  });

  it('rejects customer accessing another user order', () => {
    expect(() =>
      service.assertOrderAccess(
        { userId: 'user_2', customerEmail: 'b@example.com' },
        { userId: 'user_1', role: Role.CUSTOMER },
      ),
    ).toThrow(ForbiddenException);
  });

  it('requires authentication when no guest email', () => {
    expect(() => service.buildContext(undefined, undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it('parses bearer token into context', () => {
    jwt.verifyAccessToken.mockReturnValue({
      sub: 'user_1',
      role: Role.CUSTOMER,
      type: 'access',
    });

    const ctx = service.buildContext('Bearer token', undefined);
    expect(ctx).toEqual({ userId: 'user_1', role: Role.CUSTOMER });
  });
});
