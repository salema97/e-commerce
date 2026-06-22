import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceiptService } from './receipt.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ReceiptService', () => {
  let service: ReceiptService;
  let prisma: {
    order: { findUnique: ReturnType<typeof vi.fn> };
    receipt: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: vi.fn() },
      receipt: { findUnique: vi.fn(), create: vi.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [ReceiptService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ReceiptService);
  });

  describe('generateReceipt', () => {
    it('creates a new receipt with placeholder URL', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-1', customerEmail: 'cust@example.com' });
      prisma.receipt.findUnique.mockResolvedValue(null);
      prisma.receipt.create.mockResolvedValue({ id: 'rc1', orderId: 'o1', number: 'RCP-ORD-1-XYZ', url: 'receipts://o1/RCP-ORD-1-XYZ.pdf', createdAt: new Date() });

      const result = await service.generateReceipt('o1');
      expect(result.orderId).toBe('o1');
      expect(result.url).toContain('receipts://');
      expect(result.emailDelivered).toBe(true);
      expect(prisma.receipt.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ orderId: 'o1' }),
      }));
    });

    it('returns existing receipt without regenerating', async () => {
      prisma.receipt.findUnique.mockResolvedValue({ id: 'rc1', orderId: 'o1', number: 'RCP-1', url: 'receipts://o1/1.pdf', createdAt: new Date() });
      const result = await service.generateReceipt('o1');
      expect(result.id).toBe('rc1');
      expect(prisma.receipt.create).not.toHaveBeenCalled();
    });

    it('marks emailDelivered false when no customer email', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', orderNumber: 'ORD-1', customerEmail: null });
      prisma.receipt.findUnique.mockResolvedValue(null);
      prisma.receipt.create.mockResolvedValue({ id: 'rc1', orderId: 'o1', number: 'RCP-1', url: 'u', createdAt: new Date() });
      const result = await service.generateReceipt('o1');
      expect(result.emailDelivered).toBe(false);
    });

    it('throws NotFound for unknown order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.generateReceipt('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getReceipt', () => {
    it('returns the receipt when found', async () => {
      prisma.receipt.findUnique.mockResolvedValue({ id: 'rc1', orderId: 'o1', number: 'RCP-1', url: 'u', createdAt: new Date() });
      const result = await service.getReceipt('o1');
      expect(result.id).toBe('rc1');
    });

    it('throws BadRequest when not generated', async () => {
      prisma.receipt.findUnique.mockResolvedValue(null);
      await expect(service.getReceipt('o1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
