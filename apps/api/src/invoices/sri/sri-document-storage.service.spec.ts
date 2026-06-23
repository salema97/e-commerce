import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { StorageService } from '../../storage/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriDocumentStorageService } from './sri-document-storage.service.js';

describe('SriDocumentStorageService', () => {
  let service: SriDocumentStorageService;
  let storage: {
    uploadBuffer: ReturnType<typeof vi.fn>;
    getSignedUrl: ReturnType<typeof vi.fn>;
  };
  let prisma: {
    invoice: { update: ReturnType<typeof vi.fn> };
    creditNote: { update: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    storage = {
      uploadBuffer: vi.fn().mockResolvedValue({
        key: 'sri/invoices/1/invoice.xml',
        publicUrl: 'https://public.example.com/sri/invoices/1/invoice.xml',
      }),
      getSignedUrl: vi.fn().mockResolvedValue('https://signed.example.com/doc'),
    };

    prisma = {
      invoice: { update: vi.fn().mockResolvedValue({}) },
      creditNote: { update: vi.fn().mockResolvedValue({}) },
    };

    const module = await Test.createTestingModule({
      providers: [
        SriDocumentStorageService,
        { provide: StorageService, useValue: storage },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SriDocumentStorageService);
  });

  it('uploads invoice XML and PDF and persists URLs', async () => {
    storage.uploadBuffer
      .mockResolvedValueOnce({
        key: 'sri/invoices/inv-1/invoice.xml',
        publicUrl: 'https://public.example.com/sri/invoices/inv-1/invoice.xml',
      })
      .mockResolvedValueOnce({
        key: 'sri/invoices/inv-1/ride.pdf',
        publicUrl: 'https://public.example.com/sri/invoices/inv-1/ride.pdf',
      });

    const result = await service.uploadInvoiceDocuments(
      'inv-1',
      '<xml/>',
      Buffer.from('pdf'),
    );

    expect(storage.uploadBuffer).toHaveBeenCalledWith(
      'sri/invoices/inv-1/invoice.xml',
      Buffer.from('<xml/>'),
      'application/xml',
    );
    expect(storage.uploadBuffer).toHaveBeenCalledWith(
      'sri/invoices/inv-1/ride.pdf',
      Buffer.from('pdf'),
      'application/pdf',
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        xmlUrl: 'https://public.example.com/sri/invoices/inv-1/invoice.xml',
        pdfUrl: 'https://public.example.com/sri/invoices/inv-1/ride.pdf',
      },
    });
    expect(result).toEqual({
      xmlUrl: 'https://public.example.com/sri/invoices/inv-1/invoice.xml',
      pdfUrl: 'https://public.example.com/sri/invoices/inv-1/ride.pdf',
      xmlKey: 'sri/invoices/inv-1/invoice.xml',
      pdfKey: 'sri/invoices/inv-1/ride.pdf',
    });
  });

  it('uploads credit note XML and PDF and persists URLs', async () => {
    storage.uploadBuffer
      .mockResolvedValueOnce({
        key: 'sri/credit-notes/cn-1/credit-note.xml',
        publicUrl: 'https://public.example.com/sri/credit-notes/cn-1/credit-note.xml',
      })
      .mockResolvedValueOnce({
        key: 'sri/credit-notes/cn-1/ride.pdf',
        publicUrl: 'https://public.example.com/sri/credit-notes/cn-1/ride.pdf',
      });

    const result = await service.uploadCreditNoteDocuments(
      'cn-1',
      '<xml/>',
      Buffer.from('pdf'),
    );

    expect(storage.uploadBuffer).toHaveBeenCalledWith(
      'sri/credit-notes/cn-1/credit-note.xml',
      Buffer.from('<xml/>'),
      'application/xml',
    );
    expect(storage.uploadBuffer).toHaveBeenCalledWith(
      'sri/credit-notes/cn-1/ride.pdf',
      Buffer.from('pdf'),
      'application/pdf',
    );
    expect(prisma.creditNote.update).toHaveBeenCalledWith({
      where: { id: 'cn-1' },
      data: {
        xmlUrl: 'https://public.example.com/sri/credit-notes/cn-1/credit-note.xml',
        pdfUrl: 'https://public.example.com/sri/credit-notes/cn-1/ride.pdf',
      },
    });
    expect(result.pdfKey).toBe('sri/credit-notes/cn-1/ride.pdf');
    expect(result.xmlKey).toBe('sri/credit-notes/cn-1/credit-note.xml');
  });
});
