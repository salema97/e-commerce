import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface SignedDocumentUrls {
  xmlUrl: string;
  pdfUrl: string;
}

/**
 * Uploads signed XML and RIDE PDF for SRI documents to R2 and persists only
 * the object keys in Prisma. Signed URLs are generated on demand and expire
 * quickly; public URLs are never stored.
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
  ): Promise<SignedDocumentUrls> {
    const xmlKey = this.invoiceXmlKey(invoiceId);
    const pdfKey = this.invoicePdfKey(invoiceId);

    const [xml, pdf] = await Promise.all([
      this.storage.uploadBuffer(xmlKey, Buffer.from(signedXml), 'application/xml'),
      this.storage.uploadBuffer(pdfKey, pdfBuffer, 'application/pdf'),
    ]);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xmlKey: xml.key,
        pdfKey: pdf.key,
      },
    });

    return this.keysToSignedUrls(xml.key, pdf.key);
  }

  async uploadCreditNoteDocuments(
    creditNoteId: string,
    signedXml: string,
    pdfBuffer: Buffer,
  ): Promise<SignedDocumentUrls> {
    const xmlKey = this.creditNoteXmlKey(creditNoteId);
    const pdfKey = this.creditNotePdfKey(creditNoteId);

    const [xml, pdf] = await Promise.all([
      this.storage.uploadBuffer(xmlKey, Buffer.from(signedXml), 'application/xml'),
      this.storage.uploadBuffer(pdfKey, pdfBuffer, 'application/pdf'),
    ]);

    await this.prisma.creditNote.update({
      where: { id: creditNoteId },
      data: {
        xmlKey: xml.key,
        pdfKey: pdf.key,
      },
    });

    return this.keysToSignedUrls(xml.key, pdf.key);
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

  /**
   * Generate time-limited signed URLs for an invoice's XML and PDF.
   */
  async getInvoiceSignedUrls(invoiceId: string): Promise<SignedDocumentUrls> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const xmlKey = invoice.xmlKey ?? this.invoiceXmlKey(invoiceId);
    const pdfKey = invoice.pdfKey ?? this.invoicePdfKey(invoiceId);

    return this.keysToSignedUrls(xmlKey, pdfKey);
  }

  /**
   * Generate time-limited signed URLs for a credit note's XML and PDF.
   */
  async getCreditNoteSignedUrls(
    creditNoteId: string,
  ): Promise<SignedDocumentUrls> {
    const creditNote = await this.prisma.creditNote.findUnique({
      where: { id: creditNoteId },
    });

    if (!creditNote) {
      throw new NotFoundException(`Credit note ${creditNoteId} not found`);
    }

    const xmlKey = creditNote.xmlKey ?? this.creditNoteXmlKey(creditNoteId);
    const pdfKey = creditNote.pdfKey ?? this.creditNotePdfKey(creditNoteId);

    return this.keysToSignedUrls(xmlKey, pdfKey);
  }

  private async keysToSignedUrls(
    xmlKey: string,
    pdfKey: string,
  ): Promise<SignedDocumentUrls> {
    return {
      xmlUrl: await this.storage.getSignedUrl(xmlKey),
      pdfUrl: await this.storage.getSignedUrl(pdfKey),
    };
  }
}
