import { Injectable } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import {
  CreditNoteInput,
  CreditNoteItem,
} from '../invoice-provider.interface.js';
import { SRI_CREDIT_NOTE_XML_VERSION } from './sri-xml.constants.js';
import {
  buildAdditionalInfoFields,
  formatSriAmount,
  formatSriCurrency,
  formatSriDate,
  formatSriYesNo,
  resolveBuyerIdentificationType,
  resolveEmissionDate,
} from './sri-xml.utils.js';

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
  emissionDate?: Date;
  requiresAccounting?: boolean;
  specialTaxpayerNumber?: string;
}

/**
 * Builds SRI nota de crédito (04) XML documents (schema version 1.1.0).
 */
@Injectable()
export class SriCreditNoteXmlBuilder {
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
    const emissionDate = input.emissionDate ?? resolveEmissionDate(input.accessKey);

    const infoNotaCredito: Record<string, unknown> = {
      fechaEmision: formatSriDate(emissionDate),
      dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
      obligadoContabilidad: formatSriYesNo(input.requiresAccounting ?? false),
      tipoIdentificacionComprador: resolveBuyerIdentificationType(
        input.customerIdentification,
      ),
      razonSocialComprador: input.customerName ?? 'CONSUMIDOR FINAL',
      identificacionComprador:
        input.customerIdentification ?? '9999999999999',
      codDocModificado: input.creditNote.codDocModificado,
      numDocModificado: input.creditNote.numDocModificado,
      fechaEmisionDocumentoModificado:
        input.creditNote.fechaEmisionDocumentoModificado,
      totalSinImpuestos: formatSriAmount(totals.subtotal),
      valorModificacion: formatSriAmount(input.creditNote.total),
      moneda: formatSriCurrency('USD'),
      motivo: input.creditNote.reason,
      totalConImpuestos: {
        totalImpuesto: {
          codigo: '2',
          codigoPorcentaje: '4',
          baseImponible: formatSriAmount(totals.taxableBase),
          valor: formatSriAmount(totals.taxAmount),
        },
      },
    };

    if (input.specialTaxpayerNumber) {
      infoNotaCredito.contribuyenteEspecial = input.specialTaxpayerNumber;
    }

    if (input.customerAddress) {
      infoNotaCredito.direccionComprador = input.customerAddress;
    }

    const notaCredito: Record<string, unknown> = {
      '@_id': 'comprobante',
      '@_version': SRI_CREDIT_NOTE_XML_VERSION,
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
      infoNotaCredito,
      detalles: {
        detalle: input.creditNote.items.map((item) =>
          this.buildDetail(item, input.creditNote.reason),
        ),
      },
    };

    const additionalInfo = buildAdditionalInfoFields([
      { name: 'email', value: input.customerEmail },
      { name: 'telefono', value: input.customerPhone },
      {
        name: 'claveAccesoFactura',
        value: input.creditNote.invoiceAccessKey,
      },
      {
        name: 'numeroAutorizacionFactura',
        value: input.creditNote.authorizationNumber,
      },
    ]);
    if (additionalInfo) {
      notaCredito.infoAdicional = additionalInfo;
    }

    return { notaCredito };
  }

  private buildDetail(item: CreditNoteItem, defaultReason: string): unknown {
    const totalWithoutTax = item.quantity * item.unitPrice - item.discount;
    const taxValue =
      item.taxAmount ?? this.calculateTax(totalWithoutTax, item.taxRate);

    return {
      codigoPrincipal: item.code,
      descripcion: item.description,
      cantidad: formatSriAmount(item.quantity),
      precioUnitario: formatSriAmount(item.unitPrice),
      descuento: formatSriAmount(item.discount),
      precioTotalSinImpuesto: formatSriAmount(totalWithoutTax),
      impuestos: {
        impuesto: {
          codigo: '2',
          codigoPorcentaje: '4',
          tarifa: formatSriAmount(item.taxRate),
          baseImponible: formatSriAmount(totalWithoutTax),
          valor: formatSriAmount(taxValue),
        },
      },
      motivo: item.reason ?? defaultReason,
    };
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
