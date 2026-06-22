import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: { auditLog: { create: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    prisma = { auditLog: { create: vi.fn() } };
    const module = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AuditLogService);
  });

  it('creates an audit log for a create event', async () => {
    await service.log({
      actorClerkUserId: 'user_123',
      resource: 'category',
      action: 'create',
      resourceId: 'cat_1',
      after: { id: 'cat_1', name: 'Electronics' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorClerkUserId: 'user_123',
          resource: 'category',
          action: 'create',
          resourceId: 'cat_1',
          diff: {
            before: null,
            after: { id: 'cat_1', name: 'Electronics' },
            changedFields: ['id', 'name'],
          },
        }),
      }),
    );
  });

  it('creates an audit log for an update event with changed fields', async () => {
    await service.log({
      actorClerkUserId: 'user_123',
      resource: 'product',
      action: 'update',
      resourceId: 'prod_1',
      before: { id: 'prod_1', name: 'Old Name', price: 10 },
      after: { id: 'prod_1', name: 'New Name', price: 10 },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          diff: {
            before: { id: 'prod_1', name: 'Old Name', price: 10 },
            after: { id: 'prod_1', name: 'New Name', price: 10 },
            changedFields: ['name'],
          },
        }),
      }),
    );
  });

  it('creates an audit log for a delete event', async () => {
    await service.log({
      actorClerkUserId: 'user_123',
      resource: 'supplier',
      action: 'delete',
      resourceId: 'sup_1',
      before: { id: 'sup_1', name: 'Acme' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          diff: {
            before: { id: 'sup_1', name: 'Acme' },
            after: null,
            changedFields: ['id', 'name'],
          },
        }),
      }),
    );
  });

  it('uses system actor when no user is provided', async () => {
    await service.log({
      actorClerkUserId: 'system',
      resource: 'user',
      action: 'create',
      resourceId: 'user_1',
      after: { id: 'user_1' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorClerkUserId: 'system',
        }),
      }),
    );
  });

  it('does not throw when prisma create fails', async () => {
    prisma.auditLog.create.mockRejectedValueOnce(new Error('DB down'));

    await expect(
      service.log({
        actorClerkUserId: 'user_123',
        resource: 'category',
        action: 'create',
        resourceId: 'cat_1',
        after: { id: 'cat_1' },
      }),
    ).resolves.toBeUndefined();
  });
});
