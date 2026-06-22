import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from './role.enum.js';

function createGuard(role?: Role, requiredRoles?: Role[], isPublic = false) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) => {
      if (key === 'isPublic') return isPublic;
      if (key === 'roles') return requiredRoles;
      return undefined;
    }),
  } as unknown as Reflector;
  const request = { user: role ? { userId: 'u1', role } : undefined };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
  return { guard: new RolesGuard(reflector), context };
}

describe('RolesGuard', () => {
  it('skips public routes', () => {
    const { guard, context } = createGuard(Role.CUSTOMER, [Role.ADMIN], true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows when no roles required', () => {
    const { guard, context } = createGuard(Role.CUSTOMER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows matching role', () => {
    const { guard, context } = createGuard(Role.ADMIN, [Role.ADMIN, Role.SUPER_ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects non-matching role', () => {
    const { guard, context } = createGuard(Role.CUSTOMER, [Role.ADMIN]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
