import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';
import { Role } from '../auth/role.enum.js';

function buildResponse() {
  return {
    redirect: vi.fn(),
    statusCode: 0,
  } as unknown as import('express').Response;
}

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: {
    list: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    retryIssue: ReturnType<typeof vi.fn>;
    getSignedXmlUrl: ReturnType<typeof vi.fn>;
    getSignedPdfUrl: ReturnType<typeof vi.fn>;
    assertInvoiceAccess: ReturnType<typeof vi.fn>;
    issueInvoice: ReturnType<typeof vi.fn>;
    issueCreditNote: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      retryIssue: vi.fn().mockResolvedValue({ id: 'inv_1' }),
      getSignedXmlUrl: vi.fn().mockResolvedValue('https://example.com/xml'),
      getSignedPdfUrl: vi.fn().mockResolvedValue('https://example.com/pdf'),
      assertInvoiceAccess: vi.fn(),
      issueInvoice: vi.fn().mockResolvedValue({ id: 'inv_new' }),
      issueCreditNote: vi.fn().mockResolvedValue({ id: 'cn_new' }),
    };

    const module = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: service }],
    }).compile();

    controller = module.get(InvoicesController);
  });

  describe('list', () => {
    it('returns invoices for admin/finance users', async () => {
      service.list.mockResolvedValue([
        {
          id: 'inv_1',
          orderId: 'order_1',
          documentType: '01',
          accessKey: '1'.repeat(49),
          authorizationNumber: null,
          status: InvoiceStatus.AUTHORIZED,
          xmlContent: null,
          pdfUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await controller.list('order_1', InvoiceStatus.AUTHORIZED);

      expect(service.list).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order_1', status: InvoiceStatus.AUTHORIZED }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns invoice detail after access check', async () => {
      const invoice = {
        id: 'inv_1',
        orderId: 'order_1',
        documentType: '01',
        accessKey: '1'.repeat(49),
        authorizationNumber: '123',
        status: InvoiceStatus.AUTHORIZED,
        xmlContent: null,
        pdfUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: { id: 'order_1', orderNumber: 'ORD-1', user: { id: 'user_1' } },
      };
      service.findById.mockResolvedValue(invoice);

      const result = await controller.findById('inv_1', {
        userId: 'user_1',
        role: Role.CUSTOMER,
      });

      expect(service.findById).toHaveBeenCalledWith('inv_1');
      expect(service.assertInvoiceAccess).toHaveBeenCalledWith(invoice, {
        userId: 'user_1',
        role: Role.CUSTOMER,
      });
      expect(result.id).toBe('inv_1');
    });
  });

  describe('retry', () => {
    it('enqueues a retry for the invoice', async () => {
      const result = await controller.retry('inv_1');

      expect(service.retryIssue).toHaveBeenCalledWith('inv_1');
      expect(result.id).toBe('inv_1');
    });
  });

  describe('downloadXml', () => {
    it('redirects to a signed XML URL after access check', async () => {
      const invoice = {
        id: 'inv_1',
        orderId: 'order_1',
        documentType: '01',
        accessKey: '1'.repeat(49),
        authorizationNumber: '123',
        status: InvoiceStatus.AUTHORIZED,
        xmlContent: null,
        pdfUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: { id: 'order_1', orderNumber: 'ORD-1', user: { id: 'user_1' } },
      };
      service.findById.mockResolvedValue(invoice);
      const res = buildResponse();

      await controller.downloadXml('inv_1', { userId: 'user_1', role: Role.CUSTOMER }, res);

      expect(service.getSignedXmlUrl).toHaveBeenCalledWith('inv_1');
      expect(res.redirect).toHaveBeenCalledWith(302, 'https://example.com/xml');
    });
  });

  describe('downloadPdf', () => {
    it('redirects to a signed PDF URL after access check', async () => {
      const invoice = {
        id: 'inv_1',
        orderId: 'order_1',
        documentType: '01',
        accessKey: '1'.repeat(49),
        authorizationNumber: '123',
        status: InvoiceStatus.AUTHORIZED,
        xmlContent: null,
        pdfUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: { id: 'order_1', orderNumber: 'ORD-1', user: { id: 'user_1' } },
      };
      service.findById.mockResolvedValue(invoice);
      const res = buildResponse();

      await controller.downloadPdf('inv_1', { userId: 'user_1', role: Role.CUSTOMER }, res);

      expect(service.getSignedPdfUrl).toHaveBeenCalledWith('inv_1');
      expect(res.redirect).toHaveBeenCalledWith(302, 'https://example.com/pdf');
    });
  });

  describe('issueInvoice', () => {
    it('delegates to the service', async () => {
      await controller.issueInvoice({ orderId: 'order_1' } as never, 'admin_1');
      expect(service.issueInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order_1' }),
        'admin_1',
      );
    });
  });

  describe('issueCreditNote', () => {
    it('delegates to the service', async () => {
      await controller.issueCreditNote({ returnRequestId: 'rr_1' } as never, 'admin_1');
      expect(service.issueCreditNote).toHaveBeenCalledWith(
        expect.objectContaining({ returnRequestId: 'rr_1' }),
        'admin_1',
      );
    });
  });
});

describe('InvoicesService.assertInvoiceAccess', () => {
  it('allows admin roles', () => {
    const service = new InvoicesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    expect(() =>
      service.assertInvoiceAccess(
        { order: { user: { id: 'user_1' } } },
        { userId: 'admin_1', role: Role.ADMIN },
      ),
    ).not.toThrow();
  });

  it('allows customers who own the invoice order', () => {
    const service = new InvoicesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    expect(() =>
      service.assertInvoiceAccess(
        { order: { user: { id: 'user_1' } } },
        { userId: 'user_1', role: Role.CUSTOMER },
      ),
    ).not.toThrow();
  });

  it('forbids customers who do not own the invoice order', () => {
    const service = new InvoicesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    expect(() =>
      service.assertInvoiceAccess(
        { order: { user: { id: 'user_1' } } },
        { userId: 'user_2', role: Role.CUSTOMER },
      ),
    ).toThrow(ForbiddenException);
  });
});
