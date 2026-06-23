import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface StoredDocumentUrls {
  xmlUrl: string;
  pdfUrl: string;
  xmlKey: string;
  pdfKey: string;
}

export interface SignedDocumentUrls {
  xmlUrl: string;
  pdfUrl: string;
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

  /**
   * Generate time-limited signed URLs for an invoice's XML and PDF.
   * Falls back to deterministic keys when stored URLs are unavailable.
   */
  async getInvoiceSignedUrls(invoiceId: string): Promise<SignedDocumentUrls> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const xmlKey = invoice.xmlUrl
      ? this.extractKeyFromPublicUrl(invoice.xmlUrl)
      : this.invoiceXmlKey(invoiceId);
    const pdfKey = invoice.pdfUrl
      ? this.extractKeyFromPublicUrl(invoice.pdfUrl)
      : this.invoicePdfKey(invoiceId);

    return {
      xmlUrl: await this.storage.getSignedUrl(xmlKey),
      pdfUrl: await this.storage.getSignedUrl(pdfKey),
    };
  }

  /**
   * Generate time-limited signed URLs for a credit note's XML and PDF.
   * Falls back to deterministic keys when stored URLs are unavailable.
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

    const xmlKey = creditNote.xmlUrl
      ? this.extractKeyFromPublicUrl(creditNote.xmlUrl)
      : this.creditNoteXmlKey(creditNoteId);
    const pdfKey = creditNote.pdfUrl
      ? this.extractKeyFromPublicUrl(creditNote.pdfUrl)
      : this.creditNotePdfKey(creditNoteId);

    return {
      xmlUrl: await this.storage.getSignedUrl(xmlKey),
      pdfUrl: await this.storage.getSignedUrl(pdfKey),
    };
  }

  private extractKeyFromPublicUrl(publicUrl: string): string {
    try {
      const url = new URL(publicUrl);
      // Path includes leading slash; strip it to get the object key.
      return url.pathname.replace(/^\//, '');
    } catch {
      return publicUrl;
    }
  }
}
