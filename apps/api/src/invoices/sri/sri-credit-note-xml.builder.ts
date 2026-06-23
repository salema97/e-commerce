import { Injectable, Logger } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import {
  CreditNoteInput,
  CreditNoteItem,
} from '../invoice-provider.interface.js';

export interface CreditNoteXmlBuildInput {
  accessKey: string;
  customerName: string;
  customerIdentification?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  creditNote: CreditNoteInput;
  establishmentCode: string;
  emissionPointCode: string;
  sequenceNumber: string;
  environment: '1' | '2';
  companyRuc: string;
  companyName: string;
  companyTradeName?: string;
  companyAddress?: string;
}

/**
 * Builds SRI v2.32 nota de crédito (04) XML documents.
 *
 * The credit note references a previously issued factura (01) and represents
 * a partial or total reversal of its amounts. Values are kept positive because
 * that is what the SRI offline schema expects for document type 04; the credit
 * nature is expressed by the document type itself.
 */
@Injectable()
export class SriCreditNoteXmlBuilder {
  private readonly logger = new Logger(SriCreditNoteXmlBuilder.name);

  buildNotaDeCredito(input: CreditNoteXmlBuildInput): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
      attributeNamePrefix: '@_',
    });

    const document = this.buildDocument(input);
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlHeader + builder.build(document);
  }

  private buildDocument(input: CreditNoteXmlBuildInput): unknown {
    const totals = this.calculateTotals(input.creditNote.items);

    return {
      notaCredito: {
        '@_id': 'comprobante',
        '@_version': '2.3.2',
        infoTributaria: {
          ambiente: input.environment,
          tipoEmision: '1',
          razonSocial: input.companyName,
          nombreComercial: input.companyTradeName ?? input.companyName,
          ruc: input.companyRuc,
          claveAcceso: input.accessKey,
          codDoc: '04',
          estab: input.establishmentCode.padStart(3, '0'),
          ptoEmi: input.emissionPointCode.padStart(3, '0'),
          secuencial: input.sequenceNumber.padStart(9, '0'),
          dirMatriz: input.companyAddress ?? 'Direccion matriz',
        },
        infoNotaCredito: {
          fechaEmision: this.formatDate(new Date()),
          dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
          obligadoContabilidad: 'SI',
          tipoIdentificacionComprador: this.identificationType(
            input.customerIdentification,
          ),
          razonSocialComprador:
            input.customerName ?? 'CONSUMIDOR FINAL',
          identificacionComprador:
            input.customerIdentification ?? '9999999999',
          direccionComprador:
            input.customerAddress ?? 'Direccion comprador',
          codDocModificado: input.creditNote.codDocModificado,
          numDocModificado: input.creditNote.numDocModificado,
          fechaEmisionDocumentoModificado:
            input.creditNote.fechaEmisionDocumentoModificado,
          totalSinImpuestos: this.formatNumber(totals.subtotal),
          valorModificacion: this.formatNumber(input.creditNote.total),
          moneda: this.formatCurrency('USD'),
          motivo: input.creditNote.reason,
          totalConImpuestos: {
            totalImpuesto: {
              codigo: '2',
              codigoPorcentaje: '4',
              baseImponible: this.formatNumber(totals.taxableBase),
              valor: this.formatNumber(totals.taxAmount),
            },
          },
        },
        detalles: {
          detalle: input.creditNote.items.map((item) =>
            this.buildDetail(item, input.creditNote.reason),
          ),
        },
        infoAdicional: this.buildAdditionalInfo(input),
      },
    };
  }

  private buildDetail(item: CreditNoteItem, defaultReason: string): unknown {
    const totalWithoutTax = item.quantity * item.unitPrice - item.discount;
    const taxValue =
      item.taxAmount ?? this.calculateTax(totalWithoutTax, item.taxRate);
    return {
      codigoPrincipal: item.code,
      descripcion: item.description,
      cantidad: String(item.quantity),
      precioUnitario: this.formatNumber(item.unitPrice),
      descuento: this.formatNumber(item.discount),
      precioTotalSinImpuesto: this.formatNumber(totalWithoutTax),
      impuestos: {
        impuesto: {
          codigo: '2',
          codigoPorcentaje: '4',
          tarifa: this.formatNumber(item.taxRate),
          baseImponible: this.formatNumber(totalWithoutTax),
          valor: this.formatNumber(taxValue),
        },
      },
      motivo: item.reason ?? defaultReason,
    };
  }

  private buildAdditionalInfo(input: CreditNoteXmlBuildInput): unknown {
    const fields: Array<{ campoAdicional: string; '@_nombre': string }> = [];
    if (input.customerEmail) {
      fields.push({ campoAdicional: input.customerEmail, '@_nombre': 'email' });
    }
    if (input.customerPhone) {
      fields.push({ campoAdicional: input.customerPhone, '@_nombre': 'telefono' });
    }
    if (input.creditNote.invoiceAccessKey) {
      fields.push({
        campoAdicional: input.creditNote.invoiceAccessKey,
        '@_nombre': 'claveAccesoFactura',
      });
    }
    if (input.creditNote.authorizationNumber) {
      fields.push({
        campoAdicional: input.creditNote.authorizationNumber,
        '@_nombre': 'numeroAutorizacionFactura',
      });
    }
    if (fields.length === 0) {
      return { campoAdicional: { '#text': 'N/A', '@_nombre': 'observacion' } };
    }
    return { campoAdicional: fields };
  }

  private identificationType(identification?: string): string {
    if (!identification) return '07';
    if (identification.length === 10) return '05';
    if (identification.length === 13 && identification.endsWith('001')) return '04';
    return '06';
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatNumber(value: number): string {
    return value.toFixed(2);
  }

  private formatCurrency(currency: string): string {
    return currency.toUpperCase() === 'USD' ? 'DOLAR' : currency.toUpperCase();
  }

  private calculateTax(base: number, rate: number): number {
    return base * (rate / 100);
  }

  private calculateTotals(items: CreditNoteItem[]): {
    subtotal: number;
    taxableBase: number;
    taxAmount: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
      0,
    );
    const taxAmount = items.reduce(
      (sum, item) =>
        sum +
        this.calculateTax(
          item.quantity * item.unitPrice - item.discount,
          item.taxRate,
        ),
      0,
    );
    return {
      subtotal,
      taxableBase: subtotal,
      taxAmount,
    };
  }
}
