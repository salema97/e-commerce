import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyService } from './privacy.service.js';

describe('PrivacyService', () => {
  let service: PrivacyService;
  const prisma = {
    address: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn() },
    order: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn() },
    returnRequest: { findMany: vi.fn().mockResolvedValue([]) },
    loyaltyAccount: { findUnique: vi.fn().mockResolvedValue(null) },
    referralCode: { findUnique: vi.fn().mockResolvedValue(null) },
    quote: { findMany: vi.fn().mockResolvedValue([]) },
    cart: { deleteMany: vi.fn() },
    wishlist: { deleteMany: vi.fn() },
    pushDeviceToken: { deleteMany: vi.fn() },
    companyUser: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma)),
  };
  const provisioning = {
    ensureByUserId: vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      phone: null,
      role: 'CUSTOMER',
      createdAt: new Date('2026-01-01'),
      whatsappOptOut: false,
      emailOptOut: false,
      marketingEmailOptOut: false,
      ccpaDoNotSell: false,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrivacyService(prisma as never, provisioning as never);
  });

  it('exports user bundle', async () => {
    const result = await service.exportUserData('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.exportedAt).toBeTruthy();
  });

  it('anonymizes user on delete', async () => {
    const result = await service.deleteUserData('user-1');
    expect(result.anonymized).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
