import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Invoice, Order } from '@prisma/client';
import { EmailProvider } from '../../notifications/email-provider.interface.js';
import { StorageService } from '../../storage/storage.service.js';
import { WhatsAppNotificationService } from '../../whatsapp/whatsapp-notification.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriDeliveryService } from './sri-delivery.service.js';

describe('SriDeliveryService', () => {
  let service: SriDeliveryService;
  let whatsapp: { notify: ReturnType<typeof vi.fn> };
  let email: { sendTemplate: ReturnType<typeof vi.fn> };
  let storage: { getSignedUrl: ReturnType<typeof vi.fn> };
  let prisma: {
    invoice: { update: ReturnType<typeof vi.fn> };
    creditNote: { update: ReturnType<typeof vi.fn> };
  };
  let config: { get: ReturnType<typeof vi.fn> };

  const order = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customerEmail: 'cliente@example.com',
    customerPhone: '0999999999',
  } as unknown as Order;

  const invoice = {
    id: 'inv-1',
    accessKey: '1234567890123456789012345678901234567890123456789',
    documentType: '01',
  } as unknown as Invoice;

  beforeEach(async () => {
    whatsapp = { notify: vi.fn().mockResolvedValue(undefined) };
    email = { sendTemplate: vi.fn().mockResolvedValue(undefined) };
    storage = {
      getSignedUrl: vi
        .fn()
        .mockResolvedValue('https://signed.example.com/sri/invoices/inv-1/ride.pdf'),
    };
    config = { get: vi.fn() };
    prisma = {
      invoice: { update: vi.fn().mockResolvedValue({}) },
      creditNote: { update: vi.fn().mockResolvedValue({}) },
    };

    const module = await Test.createTestingModule({
      providers: [
        SriDeliveryService,
        { provide: WhatsAppNotificationService, useValue: whatsapp },
        { provide: EmailProvider, useValue: email },
        { provide: StorageService, useValue: storage },
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SriDeliveryService);
    config.get.mockImplementation((key: string) => {
      if (key === 'SRI_DELIVERY_ENABLED') return 'true';
      if (key === 'SRI_EMAIL_FROM') return 'facturas@example.com';
      return undefined;
    });
  });

  it('delivers invoice via WhatsApp and email when contact info exists', async () => {
    await service.deliverInvoice(invoice, order);

    expect(storage.getSignedUrl).toHaveBeenCalledWith(
      'sri/invoices/inv-1/ride.pdf',
    );
    expect(storage.getSignedUrl).toHaveBeenCalledWith(
      'sri/invoices/inv-1/invoice.xml',
    );
    expect(whatsapp.notify).toHaveBeenCalledWith(
      'order-1',
      'SRI_DOCUMENT_DELIVERY',
      '0999999999',
      expect.objectContaining({
        accessKey: invoice.accessKey,
        pdfUrl: expect.stringContaining('signed.example.com'),
      }),
    );
    expect(email.sendTemplate).toHaveBeenCalledWith(
      'cliente@example.com',
      'SRI_DOCUMENT_DELIVERY',
      expect.objectContaining({
        orderNumber: 'ORD-001',
        accessKey: invoice.accessKey,
      }),
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ deliveryStatus: 'DELIVERED' }),
      }),
    );
  });

  it('skips delivery and records SKIPPED when no contact info is available', async () => {
    await service.deliverInvoice(invoice, {
      ...order,
      customerEmail: '',
      customerPhone: null,
    } as unknown as Order);

    expect(whatsapp.notify).not.toHaveBeenCalled();
    expect(email.sendTemplate).not.toHaveBeenCalled();
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ deliveryStatus: 'SKIPPED' }),
      }),
    );
  });

  it('does nothing when delivery is disabled', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'SRI_DELIVERY_ENABLED') return 'false';
      return undefined;
    });

    await service.deliverInvoice(invoice, order);

    expect(whatsapp.notify).not.toHaveBeenCalled();
    expect(email.sendTemplate).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('records FAILED when signed URL generation fails', async () => {
    storage.getSignedUrl.mockRejectedValue(new Error('S3 down'));

    await service.deliverInvoice(invoice, order);

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          deliveryStatus: 'FAILED',
          deliveryError: 'S3 down',
        }),
      }),
    );
  });

  it('records FAILED when both delivery channels fail', async () => {
    whatsapp.notify.mockRejectedValue(new Error('WhatsApp down'));
    email.sendTemplate.mockRejectedValue(new Error('Email down'));

    await service.deliverInvoice(invoice, order);

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          deliveryStatus: 'FAILED',
          deliveryError: expect.stringContaining('WhatsApp down'),
        }),
      }),
    );
  });
});
