import { Injectable } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface StoredDocumentUrls {
  xmlUrl: string;
  pdfUrl: string;
  xmlKey: string;
  pdfKey: string;
}

/**
 * Uploads signed XML and RIDE PDF for SRI documents to R2 and persists the
 * resulting URLs in Prisma.
 */
@Injectable()
export class SriDocumentStorageService {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadInvoiceDocuments(
    invoiceId: string,
    signedXml: string,
    pdfBuffer: Buffer,
  ): Promise<StoredDocumentUrls> {
    const xmlKey = this.invoiceXmlKey(invoiceId);
    const pdfKey = this.invoicePdfKey(invoiceId);

    const [xml, pdf] = await Promise.all([
      this.storage.uploadBuffer(xmlKey, Buffer.from(signedXml), 'application/xml'),
      this.storage.uploadBuffer(pdfKey, pdfBuffer, 'application/pdf'),
    ]);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xmlUrl: xml.publicUrl,
        pdfUrl: pdf.publicUrl,
      },
    });

    return {
      xmlUrl: xml.publicUrl,
      pdfUrl: pdf.publicUrl,
      xmlKey,
      pdfKey,
    };
  }

  async uploadCreditNoteDocuments(
    creditNoteId: string,
    signedXml: string,
    pdfBuffer: Buffer,
  ): Promise<StoredDocumentUrls> {
    const xmlKey = this.creditNoteXmlKey(creditNoteId);
    const pdfKey = this.creditNotePdfKey(creditNoteId);

    const [xml, pdf] = await Promise.all([
      this.storage.uploadBuffer(xmlKey, Buffer.from(signedXml), 'application/xml'),
      this.storage.uploadBuffer(pdfKey, pdfBuffer, 'application/pdf'),
    ]);

    await this.prisma.creditNote.update({
      where: { id: creditNoteId },
      data: {
        xmlUrl: xml.publicUrl,
        pdfUrl: pdf.publicUrl,
      },
    });

    return {
      xmlUrl: xml.publicUrl,
      pdfUrl: pdf.publicUrl,
      xmlKey,
      pdfKey,
    };
  }

  private invoiceXmlKey(invoiceId: string): string {
    return `sri/invoices/${invoiceId}/invoice.xml`;
  }

  private invoicePdfKey(invoiceId: string): string {
    return `sri/invoices/${invoiceId}/ride.pdf`;
  }

  private creditNoteXmlKey(creditNoteId: string): string {
    return `sri/credit-notes/${creditNoteId}/credit-note.xml`;
  }

  private creditNotePdfKey(creditNoteId: string): string {
    return `sri/credit-notes/${creditNoteId}/ride.pdf`;
  }
}
