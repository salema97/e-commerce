import { describe, it, expect, vi } from 'vitest';
import { createAuditLogImmutabilityExtension } from './prisma.service.js';

describe('createAuditLogImmutabilityExtension', () => {
  const extension = createAuditLogImmutabilityExtension();

  it('throws when updating an AuditLog record', async () => {
    await expect(
      extension.query.auditLog.update({ args: {}, query: vi.fn() }),
    ).rejects.toThrow('AuditLog records are immutable');
  });

  it('throws when deleting an AuditLog record', async () => {
    await expect(
      extension.query.auditLog.delete({ args: {}, query: vi.fn() }),
    ).rejects.toThrow('AuditLog records are immutable');
  });

  it('throws for bulk mutable actions on AuditLog', async () => {
    for (const action of ['updateMany', 'deleteMany', 'upsert'] as const) {
      await expect(
        extension.query.auditLog[action]({ args: {}, query: vi.fn() }),
      ).rejects.toThrow('AuditLog records are immutable');
    }
  });

  it('does not intercept AuditLog create or read actions', () => {
    expect(extension.query.auditLog.create).toBeUndefined();
    expect(extension.query.auditLog.findMany).toBeUndefined();
    expect(extension.query.auditLog.findUnique).toBeUndefined();
  });
});
