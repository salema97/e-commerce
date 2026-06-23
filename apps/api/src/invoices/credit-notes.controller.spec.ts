import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreditNoteStatus } from '@prisma/client';
import { CreditNotesController } from './credit-notes.controller.js';
import { InvoicesService } from './invoices.service.js';

function buildResponse() {
  return {
    redirect: vi.fn(),
    statusCode: 0,
  } as unknown as import('express').Response;
}

describe('CreditNotesController', () => {
  let controller: CreditNotesController;
  let service: {
    listCreditNotes: ReturnType<typeof vi.fn>;
    findCreditNoteById: ReturnType<typeof vi.fn>;
    retryCreditNote: ReturnType<typeof vi.fn>;
    getCreditNoteSignedXmlUrl: ReturnType<typeof vi.fn>;
    getCreditNoteSignedPdfUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      listCreditNotes: vi.fn().mockResolvedValue([]),
      findCreditNoteById: vi.fn(),
      retryCreditNote: vi.fn().mockResolvedValue({ id: 'cn_1' }),
      getCreditNoteSignedXmlUrl: vi.fn().mockResolvedValue('https://example.com/cn-xml'),
      getCreditNoteSignedPdfUrl: vi.fn().mockResolvedValue('https://example.com/cn-pdf'),
    };

    const module = await Test.createTestingModule({
      controllers: [CreditNotesController],
      providers: [{ provide: InvoicesService, useValue: service }],
    }).compile();

    controller = module.get(CreditNotesController);
  });

  describe('list', () => {
    it('returns credit notes with filters', async () => {
      service.listCreditNotes.mockResolvedValue([
        {
          id: 'cn_1',
          accessKey: '1'.repeat(49),
          parentInvoiceAccessKey: '1'.repeat(49),
          authorizationNumber: null,
          status: CreditNoteStatus.AUTHORIZED,
          xmlContent: null,
          totalAmount: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await controller.list('rr_1', CreditNoteStatus.AUTHORIZED);

      expect(service.listCreditNotes).toHaveBeenCalledWith(
        expect.objectContaining({ returnRequestId: 'rr_1', status: CreditNoteStatus.AUTHORIZED }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns credit note detail', async () => {
      service.findCreditNoteById.mockResolvedValue({
        id: 'cn_1',
        accessKey: '1'.repeat(49),
        parentInvoiceAccessKey: '1'.repeat(49),
        authorizationNumber: null,
        status: CreditNoteStatus.AUTHORIZED,
        xmlContent: null,
        totalAmount: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.findById('cn_1');

      expect(service.findCreditNoteById).toHaveBeenCalledWith('cn_1');
      expect(result.id).toBe('cn_1');
    });
  });

  describe('retry', () => {
    it('enqueues a retry for the credit note', async () => {
      const result = await controller.retry('cn_1');

      expect(service.retryCreditNote).toHaveBeenCalledWith('cn_1');
      expect(result.id).toBe('cn_1');
    });
  });

  describe('downloadXml', () => {
    it('redirects to a signed XML URL', async () => {
      const res = buildResponse();

      await controller.downloadXml('cn_1', res);

      expect(service.getCreditNoteSignedXmlUrl).toHaveBeenCalledWith('cn_1');
      expect(res.redirect).toHaveBeenCalledWith(302, 'https://example.com/cn-xml');
    });
  });

  describe('downloadPdf', () => {
    it('redirects to a signed PDF URL', async () => {
      const res = buildResponse();

      await controller.downloadPdf('cn_1', res);

      expect(service.getCreditNoteSignedPdfUrl).toHaveBeenCalledWith('cn_1');
      expect(res.redirect).toHaveBeenCalledWith(302, 'https://example.com/cn-pdf');
    });
  });
});
