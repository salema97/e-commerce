import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import 'reflect-metadata';
import { AuditInterceptor } from './audit.interceptor.js';
import { AuditLogService } from './audit-log.service.js';
import { AUDIT_KEY } from './audit.decorator.js';
import { AuthenticatedRequest } from '../auth/clerk-jwt.guard.js';

interface MockController {
  categoriesService: { findOne: ReturnType<typeof vi.fn> };
}

function decorateHandler(handler: object, metadata: { resource: string; action: string }) {
  Reflect.defineMetadata(AUDIT_KEY, metadata, handler);
}

function createExecutionContext(
  request: Partial<AuthenticatedRequest>,
  controller: MockController,
  handler: object,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => controller as unknown as new (...args: unknown[]) => unknown,
  } as ExecutionContext;
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditLogService: { log: ReturnType<typeof vi.fn> };
  let moduleRef: { get: ReturnType<typeof vi.fn> };
  let reflector: Reflector;

  beforeEach(() => {
    auditLogService = { log: vi.fn() };
    moduleRef = { get: vi.fn() };
    reflector = new Reflector();

    interceptor = new AuditInterceptor(
      reflector,
      moduleRef as unknown as ModuleRef,
      auditLogService as unknown as AuditLogService,
    );
  });

  it('passes through when no @Audit metadata is present', async () => {
    const request: Partial<AuthenticatedRequest> = {
      method: 'POST',
      path: '/categories',
      params: {},
    };
    const handler = {};
    const context = createExecutionContext(request, {
      categoriesService: { findOne: vi.fn() },
    }, handler);
    const next: CallHandler = {
      handle: () => of({ id: 'cat_1' }),
    };

    const observable = await interceptor.intercept(context, next);
    await lastValueFrom(observable);

    expect(auditLogService.log).not.toHaveBeenCalled();
  });

  it('logs a create event with before=null and after=response', async () => {
    const handler = {};
    decorateHandler(handler, { resource: 'category', action: 'create' });
    const request: Partial<AuthenticatedRequest> = {
      method: 'POST',
      path: '/categories',
      params: {},
      user: { userId: 'user_123', role: 'ADMIN' as any },
    };
    const context = createExecutionContext(request, {
      categoriesService: { findOne: vi.fn() },
    }, handler);
    const next: CallHandler = {
      handle: () => of({ id: 'cat_1', name: 'Electronics' }),
    };

    const observable = await interceptor.intercept(context, next);
    await lastValueFrom(observable);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorClerkUserId: 'user_123',
        resource: 'category',
        action: 'create',
        resourceId: 'cat_1',
        before: null,
        after: { id: 'cat_1', name: 'Electronics' },
      }),
    );
  });

  it('logs an update event with before state loaded from service', async () => {
    const handler = {};
    decorateHandler(handler, { resource: 'category', action: 'update' });
    const request: Partial<AuthenticatedRequest> = {
      method: 'PATCH',
      path: '/categories/cat_1',
      params: { id: 'cat_1' },
      user: { userId: 'user_123', role: 'ADMIN' as any },
    };
    const controller: MockController = {
      categoriesService: {
        findOne: vi.fn().mockResolvedValue({ id: 'cat_1', name: 'Old Name' }),
      },
    };
    moduleRef.get.mockReturnValue(controller);
    const context = createExecutionContext(request, controller, handler);
    const next: CallHandler = {
      handle: () => of({ id: 'cat_1', name: 'New Name' }),
    };

    const observable = await interceptor.intercept(context, next);
    await lastValueFrom(observable);

    expect(controller.categoriesService.findOne).toHaveBeenCalledWith('cat_1');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorClerkUserId: 'user_123',
        resource: 'category',
        action: 'update',
        resourceId: 'cat_1',
        before: { id: 'cat_1', name: 'Old Name' },
        after: { id: 'cat_1', name: 'New Name' },
      }),
    );
  });

  it('logs a delete event with after=null', async () => {
    const handler = {};
    decorateHandler(handler, { resource: 'category', action: 'delete' });
    const request: Partial<AuthenticatedRequest> = {
      method: 'DELETE',
      path: '/categories/cat_1',
      params: { id: 'cat_1' },
      user: { userId: 'user_123', role: 'ADMIN' as any },
    };
    const controller: MockController = {
      categoriesService: {
        findOne: vi.fn().mockResolvedValue({ id: 'cat_1', name: 'Old Name' }),
      },
    };
    moduleRef.get.mockReturnValue(controller);
    const context = createExecutionContext(request, controller, handler);
    const next: CallHandler = {
      handle: () => of({ id: 'cat_1' }),
    };

    const observable = await interceptor.intercept(context, next);
    await lastValueFrom(observable);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorClerkUserId: 'user_123',
        resource: 'category',
        action: 'delete',
        resourceId: 'cat_1',
        before: { id: 'cat_1', name: 'Old Name' },
        after: null,
      }),
    );
  });

  it('falls back to system actor when request.user is missing', async () => {
    const handler = {};
    decorateHandler(handler, { resource: 'category', action: 'create' });
    const request: Partial<AuthenticatedRequest> = {
      method: 'POST',
      path: '/categories',
      params: {},
    };
    const context = createExecutionContext(request, {
      categoriesService: { findOne: vi.fn() },
    }, handler);
    const next: CallHandler = {
      handle: () => of({ id: 'cat_1' }),
    };

    const observable = await interceptor.intercept(context, next);
    await lastValueFrom(observable);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorClerkUserId: 'system',
        metadata: expect.objectContaining({ actorType: 'system' }),
      }),
    );
  });
});
