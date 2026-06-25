import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import PDFDocument from 'pdfkit';

interface ParsedItem {
  code: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
  totalWithoutTax: string;
}

interface ParsedDocument {
  documentTypeLabel: string;
  companyName: string;
  companyTradeName?: string;
  ruc: string;
  accessKey: string;
  sequenceNumber?: string;
  establishment?: string;
  emissionPoint?: string;
  environment?: string;
  matrixAddress?: string;
  issueDate?: string;
  customerName?: string;
  customerIdentification?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: string;
  discount?: string;
  tax?: string;
  total?: string;
  currency?: string;
  items: ParsedItem[];
  modifiedDocumentNumber?: string;
  modifiedDocumentDate?: string;
  reason?: string;
}

/**
 * Generates a RIDE (Representación Impresa de Documentos Electrónicos) PDF
 * from an SRI-authorized XML document.
 */
@Injectable()
export class SriRidePdfService {
  generateFromAuthorizedXml(
    xml: string,
    authorizationNumber?: string,
    authorizationDate?: Date,
  ): Promise<Buffer> {
    try {
      const parsed = this.parseXml(xml);
      return this.buildPdf(parsed, authorizationNumber, authorizationDate);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private parseXml(xml: string): ParsedDocument {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: false,
      trimValues: true,
    });

    const root = parser.parse(xml);
    const document = root.factura ?? root.notaCredito;

    if (!document) {
      throw new Error('Unsupported SRI XML document type');
    }

    const infoTributaria = document.infoTributaria ?? {};
    const info = document.infoFactura ?? document.infoNotaCredito ?? {};
    const isCreditNote = !!root.notaCredito;

    const additional = this.parseAdditionalInfo(document.infoAdicional);

    return {
      documentTypeLabel: isCreditNote ? 'NOTA DE CREDITO' : 'FACTURA',
      companyName: this.getText(infoTributaria.razonSocial) ?? '',
      companyTradeName: this.getText(infoTributaria.nombreComercial),
      ruc: this.getText(infoTributaria.ruc) ?? '',
      accessKey: this.getText(infoTributaria.claveAcceso) ?? '',
      sequenceNumber: this.getText(infoTributaria.secuencial),
      establishment: this.getText(infoTributaria.estab),
      emissionPoint: this.getText(infoTributaria.ptoEmi),
      environment: this.getText(infoTributaria.ambiente) === '1' ? 'PRUEBAS' : 'PRODUCCION',
      matrixAddress: this.getText(infoTributaria.dirMatriz),
      issueDate: this.getText(info.fechaEmision),
      customerName: this.getText(info.razonSocialComprador),
      customerIdentification: this.getText(info.identificacionComprador),
      customerAddress: this.getText(info.direccionComprador),
      customerEmail: additional.email,
      customerPhone: additional.telefono,
      subtotal: this.getText(info.totalSinImpuestos),
      discount: this.getText(info.totalDescuento),
      tax: this.extractTax(info.totalConImpuestos),
      total: this.getText(info.importeTotal),
      currency: this.getText(info.moneda) === 'DOLAR' ? 'USD' : (this.getText(info.moneda) ?? 'USD'),
      items: this.parseItems(document.detalles?.detalle),
      modifiedDocumentNumber: this.getText(info.numDocModificado),
      modifiedDocumentDate: this.getText(info.fechaEmisionDocumentoModificado),
      reason: this.getText(info.motivo),
    };
  }

  private getText(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return (value as Record<string, string>)['#text'];
    }
    return String(value);
  }

  private parseAdditionalInfo(infoAdicional: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    if (!infoAdicional) return result;

    const rawFields = (infoAdicional as { campoAdicional?: unknown }).campoAdicional;
    const fields = Array.isArray(rawFields)
      ? rawFields
      : [rawFields].filter(Boolean);

    for (const field of fields) {
      if (!field) continue;
      const name =
        (field as Record<string, string>)['@_nombre'] ??
        (field as Record<string, string>).nombre;
      const text = this.getText(field);
      if (name && text) {
        result[name] = text;
      }
    }

    return result;
  }

  private extractTax(totalConImpuestos: unknown): string | undefined {
    const impuesto = (totalConImpuestos as { totalImpuesto?: unknown } | undefined)
      ?.totalImpuesto;
    if (Array.isArray(impuesto)) {
      const sum = impuesto.reduce(
        (acc, curr) => acc + Number(this.getText((curr as { valor?: unknown }).valor) ?? 0),
        0,
      );
      return sum.toFixed(2);
    }
    return this.getText((impuesto as { valor?: unknown } | undefined)?.valor);
  }

  private parseItems(detalle: unknown): ParsedItem[] {
    if (!detalle) return [];
    const rawItems = Array.isArray(detalle) ? detalle : [detalle];

    return rawItems.map((item) => {
      const impuesto = (item as { impuestos?: { impuesto?: { valor?: unknown } } }).impuestos
        ?.impuesto;
      const taxValue = Array.isArray(impuesto)
        ? impuesto[0]?.valor
        : impuesto?.valor;

      return {
        code: this.getText((item as { codigoPrincipal?: unknown }).codigoPrincipal) ?? '',
        description: this.getText((item as { descripcion?: unknown }).descripcion) ?? '',
        quantity: this.getText((item as { cantidad?: unknown }).cantidad) ?? '0',
        unitPrice: this.getText((item as { precioUnitario?: unknown }).precioUnitario) ?? '0.00',
        discount: this.getText((item as { descuento?: unknown }).descuento) ?? '0.00',
        tax: this.getText(taxValue) ?? '0.00',
        totalWithoutTax: this.getText((item as { precioTotalSinImpuesto?: unknown }).precioTotalSinImpuesto) ?? '0.00',
      };
    });
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private buildPdf(
    doc: ParsedDocument,
    authorizationNumber?: string,
    authorizationDate?: Date,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      pdf.on('data', (chunk) => buffers.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(buffers)));
      pdf.on('error', reject);

      this.renderHeader(pdf, doc);
      this.renderCustomer(pdf, doc);
      this.renderItems(pdf, doc.items);
      this.renderTotals(pdf, doc);
      this.renderAuthorization(pdf, doc, authorizationNumber, authorizationDate);

      pdf.end();
    });
  }

  private renderHeader(pdf: PDFKit.PDFDocument, doc: ParsedDocument): void {
    const startY = pdf.y;

    // Logo placeholder
    pdf.rect(40, startY, 80, 40).stroke('#000000');
    pdf.fontSize(10).text('LOGO', 40, startY + 14, {
      width: 80,
      align: 'center',
    });

    // Company info
    pdf.fontSize(12).text(doc.companyName?.toUpperCase() ?? '', 130, startY, {
      width: 300,
    });
    pdf.fontSize(9);
    if (doc.companyTradeName && doc.companyTradeName !== doc.companyName) {
      pdf.text(doc.companyTradeName, { width: 300 });
    }
    pdf.text(`RUC: ${doc.ruc ?? ''}`, { width: 300 });
    if (doc.matrixAddress) {
      pdf.text(`Dir. Matriz: ${doc.matrixAddress}`, { width: 300 });
    }

    // Document box
    const boxX = 440;
    pdf.rect(boxX, startY, 120, 75).stroke('#000000');
    pdf.fontSize(10).text(doc.documentTypeLabel, boxX + 5, startY + 5, {
      width: 110,
      align: 'center',
    });
    pdf.fontSize(8).text(`Ambiente: ${doc.environment ?? ''}`, boxX + 5, startY + 25, {
      width: 110,
    });
    if (doc.sequenceNumber) {
      pdf.text(`Secuencial: ${doc.sequenceNumber}`, boxX + 5, undefined, {
        width: 110,
      });
    }
    if (doc.establishment && doc.emissionPoint) {
      pdf.text(`Estab/Pto: ${doc.establishment}-${doc.emissionPoint}`, boxX + 5, undefined, {
        width: 110,
      });
    }

    pdf.moveDown(2);
  }

  private renderCustomer(pdf: PDFKit.PDFDocument, doc: ParsedDocument): void {
    pdf.fontSize(10).text('INFORMACION DEL COMPRADOR', { underline: true });
    pdf.moveDown(0.2);

    pdf.fontSize(9);
    pdf.text(`Razon Social / Nombre: ${doc.customerName ?? ''}`);
    pdf.text(`Identificacion: ${doc.customerIdentification ?? ''}`);
    if (doc.customerAddress) {
      pdf.text(`Direccion: ${doc.customerAddress}`);
    }
    if (doc.customerEmail) {
      pdf.text(`Email: ${doc.customerEmail}`);
    }
    if (doc.customerPhone) {
      pdf.text(`Telefono: ${doc.customerPhone}`);
    }
    if (doc.issueDate) {
      pdf.text(`Fecha de emision: ${doc.issueDate}`);
    }

    if (doc.documentTypeLabel === 'NOTA DE CREDITO') {
      if (doc.modifiedDocumentNumber) {
        pdf.text(`Documento modificado: ${doc.modifiedDocumentNumber}`);
      }
      if (doc.modifiedDocumentDate) {
        pdf.text(`Fecha documento modificado: ${doc.modifiedDocumentDate}`);
      }
      if (doc.reason) {
        pdf.text(`Motivo: ${doc.reason}`);
      }
    }

    pdf.moveDown();
  }

  private renderItems(pdf: PDFKit.PDFDocument, items: ParsedItem[]): void {
    const headers = ['Codigo', 'Descripcion', 'Cant', 'P.Unit', 'Desc', 'Imp', 'Total'];
    const colWidths = [60, 190, 35, 60, 45, 50, 60];
    const startX = 40;
    const rowHeight = 18;

    pdf.fontSize(9).text('DETALLE', { underline: true });
    pdf.moveDown(0.3);

    // Header row
    let x = startX;
    pdf.font('Helvetica-Bold').fontSize(8);
    headers.forEach((header, index) => {
      pdf.text(header, x, pdf.y, { width: colWidths[index], align: 'left' });
      x += colWidths[index];
    });
    pdf.moveDown(0.2);

    // Separator
    const lineY = pdf.y;
    pdf.moveTo(startX, lineY).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), lineY).stroke();
    pdf.moveDown(0.2);

    // Items
    pdf.font('Helvetica').fontSize(8);
    for (const item of items) {
      const y = pdf.y;
      x = startX;

      pdf.text(item.code, x, y, { width: colWidths[0] });
      x += colWidths[0];
      pdf.text(item.description, x, y, { width: colWidths[1] });
      x += colWidths[1];
      pdf.text(item.quantity, x, y, { width: colWidths[2], align: 'right' });
      x += colWidths[2];
      pdf.text(item.unitPrice, x, y, { width: colWidths[3], align: 'right' });
      x += colWidths[3];
      pdf.text(item.discount, x, y, { width: colWidths[4], align: 'right' });
      x += colWidths[4];
      pdf.text(item.tax, x, y, { width: colWidths[5], align: 'right' });
      x += colWidths[5];
      pdf.text(item.totalWithoutTax, x, y, { width: colWidths[6], align: 'right' });

      pdf.y = Math.max(pdf.y, y + rowHeight);
    }

    pdf.moveDown();
  }

  private renderTotals(pdf: PDFKit.PDFDocument, doc: ParsedDocument): void {
    const labelX = 380;
    const valueX = 470;

    pdf.font('Helvetica-Bold').fontSize(9);
    pdf.text('SUBTOTAL:', labelX, pdf.y, { width: 80, align: 'right' });
    pdf.text(doc.subtotal ?? '0.00', valueX, pdf.y, { width: 70, align: 'right' });

    pdf.text('DESCUENTO:', labelX, undefined, { width: 80, align: 'right' });
    pdf.text(doc.discount ?? '0.00', valueX, pdf.y, { width: 70, align: 'right' });

    pdf.text('IMPUESTOS:', labelX, undefined, { width: 80, align: 'right' });
    pdf.text(doc.tax ?? '0.00', valueX, pdf.y, { width: 70, align: 'right' });

    pdf.text('TOTAL:', labelX, undefined, { width: 80, align: 'right' });
    pdf.text(doc.total ?? '0.00', valueX, pdf.y, { width: 70, align: 'right' });

    if (doc.currency) {
      pdf.font('Helvetica').fontSize(8);
      pdf.text(`Moneda: ${doc.currency}`, labelX, undefined, {
        width: 160,
        align: 'right',
      });
    }

    pdf.moveDown();
  }

  private renderAuthorization(
    pdf: PDFKit.PDFDocument,
    doc: ParsedDocument,
    authorizationNumber?: string,
    authorizationDate?: Date,
  ): void {
    pdf.fontSize(9).text('INFORMACION DE AUTORIZACION', { underline: true });
    pdf.moveDown(0.2);

    pdf.fontSize(8);
    if (authorizationNumber) {
      pdf.text(`Numero de autorizacion: ${authorizationNumber}`);
    }
    if (authorizationDate) {
      pdf.text(`Fecha de autorizacion: ${this.formatDate(authorizationDate)}`);
    }

    pdf.moveDown(0.5);
    pdf.text('Clave de acceso:', { underline: false });
    pdf.font('Courier').fontSize(7).text(doc.accessKey ?? '', {
      width: 520,
      align: 'left',
    });
  }
}
