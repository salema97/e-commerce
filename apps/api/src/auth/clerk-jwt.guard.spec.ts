import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ClerkJwtGuard } from './clerk-jwt.guard.js';
import { Role } from './role.enum.js';
import * as clerkBackend from '@clerk/backend';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

function createGuardAndContext(
  request: { headers: Record<string, string>; user?: unknown },
  handlerMeta: Record<string, unknown> = {},
  prisma?: { user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } },
) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) => handlerMeta[key]),
  } as unknown as Reflector;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
  const guard = new ClerkJwtGuard(
    reflector,
    new ConfigService({ CLERK_SECRET_KEY: 'test' }),
    (prisma ?? { user: { findUnique: vi.fn(), update: vi.fn() } }) as never,
  );
  return { guard, context };
}

describe('ClerkJwtGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows @Public() routes without token', async () => {
    const { guard, context } = createGuardAndContext(
      { headers: {} },
      { isPublic: true },
    );
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects missing authorization header', async () => {
    const { guard, context } = createGuardAndContext({ headers: {} });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid token', async () => {
    vi.mocked(clerkBackend.verifyToken).mockRejectedValueOnce(new Error('invalid'));
    const { guard, context } = createGuardAndContext({
      headers: { authorization: 'Bearer bad' },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user from valid token', async () => {
    vi.mocked(clerkBackend.verifyToken).mockResolvedValueOnce({
      sub: 'user_123',
      public_metadata: { role: Role.ADMIN },
    } as Awaited<ReturnType<typeof clerkBackend.verifyToken>>);
    const request = { headers: { authorization: 'Bearer valid' } };
    const { guard, context } = createGuardAndContext(request);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user_123', role: Role.ADMIN });
  });

  it('reconciles DB role when JWT role differs from DB role', async () => {
    vi.mocked(clerkBackend.verifyToken).mockResolvedValueOnce({
      sub: 'user_123',
      public_metadata: { role: Role.ADMIN },
    } as Awaited<ReturnType<typeof clerkBackend.verifyToken>>);

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'u1', role: Role.CUSTOMER }),
        update: vi.fn().mockResolvedValue({ id: 'u1', role: Role.ADMIN }),
      },
    };

    const request = { headers: { authorization: 'Bearer valid' } };
    const { guard, context } = createGuardAndContext(request, {}, prisma);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkUserId: 'user_123' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { clerkUserId: 'user_123' },
      data: { role: Role.ADMIN },
    });
    expect(request.user).toEqual({ userId: 'user_123', role: Role.ADMIN });
  });

  it('does not update DB role when it already matches JWT', async () => {
    vi.mocked(clerkBackend.verifyToken).mockResolvedValueOnce({
      sub: 'user_123',
      public_metadata: { role: Role.ADMIN },
    } as Awaited<ReturnType<typeof clerkBackend.verifyToken>>);

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'u1', role: Role.ADMIN }),
        update: vi.fn(),
      },
    };

    const request = { headers: { authorization: 'Bearer valid' } };
    const { guard, context } = createGuardAndContext(request, {}, prisma);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(request.user).toEqual({ userId: 'user_123', role: Role.ADMIN });
  });

  it('continues auth when DB reconciliation fails', async () => {
    vi.mocked(clerkBackend.verifyToken).mockResolvedValueOnce({
      sub: 'user_123',
      public_metadata: { role: Role.ADMIN },
    } as Awaited<ReturnType<typeof clerkBackend.verifyToken>>);

    const prisma = {
      user: {
        findUnique: vi.fn().mockRejectedValue(new Error('DB unavailable')),
        update: vi.fn(),
      },
    };

    const request = { headers: { authorization: 'Bearer valid' } };
    const { guard, context } = createGuardAndContext(request, {}, prisma);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user_123', role: Role.ADMIN });
  });
});
