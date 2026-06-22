import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, OrderStatus, ReturnStatus, RefundMethod } from '@prisma/client';
import { ReturnsService } from './returns.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit/audit-log.service.js';

describe('ReturnsService', () => {
  let service: ReturnsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let auditLog: { log: ReturnType<typeof vi.fn> };
  let configService: { get: ReturnType<typeof vi.fn> };

  function buildPrismaMock() {
    return {
      returnRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      order: { findUnique: vi.fn() },
      storeCredit: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          storeCredit: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          },
        }),
      ),
    };
  }

  beforeEach(async () => {
    prisma = buildPrismaMock();
    auditLog = { log: vi.fn().mockResolvedValue(undefined) };
    configService = { get: vi.fn(() => 30) };

    const module = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    service = module.get(ReturnsService);
  });

  function buildDeliveredOrder(overrides: Partial<{
    id: string;
    userId: string | null;
    status: OrderStatus;
    updatedAt: Date;
    items: Array<{ id: string; productId: string; variantId: string | null; quantity: number }>;
  }> = {}) {
    return {
      id: 'o1',
      userId: 'u1',
      status: OrderStatus.DELIVERED,
      updatedAt: new Date(),
      items: [
        { id: 'oi1', productId: 'p1', variantId: null, quantity: 2 },
      ],
      ...overrides,
    };
  }

  describe('createReturnRequest', () => {
    it('creates a return request for a delivered order owned by the user', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
      prisma.returnRequest.create.mockResolvedValue({
        id: 'rr1',
        orderId: 'o1',
        status: ReturnStatus.REQUESTED,
        items: [{ id: 'ri1', productId: 'p1', quantity: 1 }],
      });

      const result = await service.createReturnRequest({
        orderId: 'o1',
        userId: 'u1',
        reason: 'damaged on arrival',
        items: [{ productId: 'p1', quantity: 1 }],
      });

      expect(result.id).toBe('rr1');
      expect(prisma.returnRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'o1',
          userId: 'u1',
          reason: 'damaged on arrival',
          status: ReturnStatus.REQUESTED,
          returnWindowDays: 30,
          items: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ productId: 'p1', quantity: 1 }),
            ]),
          }),
        }),
      }));
      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        resource: 'ReturnRequest',
        action: 'CREATE',
        resourceId: 'rr1',
      }));
    });

    it('throws NotFound when order is missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.createReturnRequest({
          orderId: 'missing',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when user requests a return for another user order', async () => {
      prisma.order.findUnique.mockResolvedValue(
        buildDeliveredOrder({ userId: 'someone-else' }),
      );
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequest when order is not delivered', async () => {
      prisma.order.findUnique.mockResolvedValue(
        buildDeliveredOrder({ status: OrderStatus.SHIPPED }),
      );
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when return window has elapsed', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      prisma.order.findUnique.mockResolvedValue(
        buildDeliveredOrder({ updatedAt: oldDate }),
      );
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'p1', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when items list is empty', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when return item is not on the order', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'not-on-order', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when return quantity exceeds ordered quantity', async () => {
      prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
      await expect(
        service.createReturnRequest({
          orderId: 'o1',
          userId: 'u1',
          reason: 'x',
          items: [{ productId: 'p1', quantity: 5 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listReturns', () => {
    it('lists returns with filters applied', async () => {
      prisma.returnRequest.findMany.mockResolvedValue([
        { id: 'rr1', status: ReturnStatus.REQUESTED, items: [] },
      ]);
      const result = await service.listReturns({
        status: ReturnStatus.REQUESTED,
        orderId: 'o1',
        limit: 10,
        offset: 5,
      });
      expect(result).toHaveLength(1);
      expect(prisma.returnRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: ReturnStatus.REQUESTED, orderId: 'o1' },
        take: 10,
        skip: 5,
      }));
    });
  });

  describe('getReturn', () => {
    it('returns the record when found', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({ id: 'rr1', items: [] });
      expect((await service.getReturn('rr1')).id).toBe('rr1');
    });

    it('throws NotFound when missing', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(null);
      await expect(service.getReturn('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStatus - state machine', () => {
    it('rejects invalid transition REQUESTED -> INSPECTION', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.REQUESTED,
        items: [],
      });
      await expect(
        service.updateStatus('rr1', { status: ReturnStatus.INSPECTION }, 'admin1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects transition out of CLOSED terminal state', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.CLOSED,
        items: [],
      });
      await expect(
        service.updateStatus('rr1', { status: ReturnStatus.RESOLVED }, 'admin1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects no-op transition to same status', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.APPROVED,
        items: [],
      });
      await expect(
        service.updateStatus('rr1', { status: ReturnStatus.APPROVED }, 'admin1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions REQUESTED -> APPROVED and records approver', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.REQUESTED,
        items: [],
      });
      prisma.returnRequest.update.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.APPROVED,
        approvedById: 'admin1',
        items: [],
      });
      const result = await service.updateStatus(
        'rr1',
        { status: ReturnStatus.APPROVED },
        'admin1',
      );
      expect(result.status).toBe(ReturnStatus.APPROVED);
      expect(prisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: ReturnStatus.APPROVED,
          approvedById: 'admin1',
        }),
      }));
      expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
        resource: 'ReturnRequest',
        action: 'STATUS_CHANGE',
        before: { status: ReturnStatus.REQUESTED },
        after: expect.objectContaining({ status: ReturnStatus.APPROVED }),
      }));
    });

    it('requires refundMethod when transitioning to RESOLVED', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.INSPECTION,
        items: [],
      });
      await expect(
        service.updateStatus('rr1', { status: ReturnStatus.RESOLVED }, 'admin1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions INSPECTION -> RESOLVED with refundMethod and sets resolvedAt', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.INSPECTION,
        items: [],
      });
      prisma.returnRequest.update.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.RESOLVED,
        refundMethod: RefundMethod.STORE_CREDIT,
        resolvedAt: new Date(),
        items: [],
      });
      const result = await service.updateStatus(
        'rr1',
        { status: ReturnStatus.RESOLVED, refundMethod: RefundMethod.STORE_CREDIT },
        'admin1',
      );
      expect(result.status).toBe(ReturnStatus.RESOLVED);
      expect(prisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: ReturnStatus.RESOLVED,
          refundMethod: RefundMethod.STORE_CREDIT,
          resolvedAt: expect.any(Date),
        }),
      }));
    });

    it('transitions RESOLVED -> CLOSED and sets closedAt', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.RESOLVED,
        items: [],
      });
      prisma.returnRequest.update.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.CLOSED,
        closedAt: new Date(),
        items: [],
      });
      const result = await service.updateStatus(
        'rr1',
        { status: ReturnStatus.CLOSED },
        'admin1',
      );
      expect(result.status).toBe(ReturnStatus.CLOSED);
      expect(prisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: ReturnStatus.CLOSED,
          closedAt: expect.any(Date),
        }),
      }));
    });

    it('records rejectedById on REJECTED transition', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.REQUESTED,
        items: [],
      });
      prisma.returnRequest.update.mockResolvedValue({
        id: 'rr1',
        status: ReturnStatus.REJECTED,
        rejectedById: 'admin1',
        items: [],
      });
      const result = await service.updateStatus(
        'rr1',
        { status: ReturnStatus.REJECTED, notes: 'outside window' },
        'admin1',
      );
      expect(result.status).toBe(ReturnStatus.REJECTED);
      expect(prisma.returnRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: ReturnStatus.REJECTED,
          rejectedById: 'admin1',
        }),
      }));
    });

    it('throws NotFound when updating missing return', async () => {
      prisma.returnRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('missing', { status: ReturnStatus.APPROVED }, 'admin1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('falls back to 30-day window when env not set', async () => {
    configService.get.mockReturnValue(undefined);
    // Re-instantiate the service to pick up the new config
    const fresh = new ReturnsService(prisma as never, auditLog as never, configService as never);
    prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
    prisma.returnRequest.create.mockResolvedValue({ id: 'rr1', items: [] });
    await fresh.createReturnRequest({
      orderId: 'o1',
      userId: 'u1',
      reason: 'x',
      items: [{ productId: 'p1', quantity: 1 }],
    });
    expect(prisma.returnRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ returnWindowDays: 30 }),
    }));
  });

  it('uses Prisma.Decimal for refundValue when provided', async () => {
    prisma.order.findUnique.mockResolvedValue(buildDeliveredOrder());
    prisma.returnRequest.create.mockResolvedValue({ id: 'rr1', items: [] });
    await service.createReturnRequest({
      orderId: 'o1',
      userId: 'u1',
      reason: 'x',
      items: [{ productId: 'p1', quantity: 1, refundValue: 19.99 }],
    });
    expect(prisma.returnRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        items: expect.objectContaining({
          create: expect.arrayContaining([
            expect.objectContaining({ refundValue: new Prisma.Decimal(19.99) }),
          ]),
        }),
      }),
    }));
  });
});
