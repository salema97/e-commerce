import { Injectable } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import { InvoiceOrder, InvoiceItem } from '../invoice-provider.interface.js';
import {
  SRI_DEFAULT_PAYMENT_METHOD_CODE,
  SRI_INVOICE_XML_VERSION,
} from './sri-xml.constants.js';
import {
  buildAdditionalInfoFields,
  formatSriAmount,
  formatSriCurrency,
  formatSriDate,
  formatSriQuantity,
  formatSriYesNo,
  resolveBuyerIdentificationType,
  resolveEmissionDate,
} from './sri-xml.utils.js';

export interface XmlBuildInput {
  accessKey: string;
  order: InvoiceOrder;
  establishmentCode: string;
  emissionPointCode: string;
  sequenceNumber: string;
  environment: '1' | '2';
  companyRuc: string;
  companyName: string;
  companyTradeName?: string;
  companyAddress?: string;
  /** When omitted, parsed from the first 8 digits (ddmmyyyy) of accessKey. */
  emissionDate?: Date;
  requiresAccounting?: boolean;
  specialTaxpayerNumber?: string;
}

@Injectable()
export class SriXmlBuilder {
  buildFactura(input: XmlBuildInput): string {
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

  private buildDocument(input: XmlBuildInput): unknown {
    const emissionDate = input.emissionDate ?? resolveEmissionDate(input.accessKey);
    const infoFactura: Record<string, unknown> = {
      fechaEmision: formatSriDate(emissionDate),
      dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
      obligadoContabilidad: formatSriYesNo(input.requiresAccounting ?? false),
      tipoIdentificacionComprador: resolveBuyerIdentificationType(
        input.order.customerIdentification,
      ),
      razonSocialComprador: input.order.customerName ?? 'CONSUMIDOR FINAL',
      identificacionComprador:
        input.order.customerIdentification ?? '9999999999999',
      totalSinImpuestos: formatSriAmount(
        input.order.subtotal - input.order.discountAmount,
      ),
      totalDescuento: formatSriAmount(input.order.discountAmount),
      totalConImpuestos: {
        totalImpuesto: {
          codigo: '2',
          codigoPorcentaje: '4',
          baseImponible: formatSriAmount(
            input.order.subtotal - input.order.discountAmount,
          ),
          valor: formatSriAmount(input.order.taxAmount),
        },
      },
      propina: '0.00',
      importeTotal: formatSriAmount(input.order.total),
      moneda: formatSriCurrency(input.order.currency),
      pagos: {
        pago: {
          formaPago: input.order.paymentMethodCode ?? SRI_DEFAULT_PAYMENT_METHOD_CODE,
          total: formatSriAmount(input.order.total),
        },
      },
    };

    if (input.specialTaxpayerNumber) {
      infoFactura.contribuyenteEspecial = input.specialTaxpayerNumber;
    }

    if (input.order.customerAddress) {
      infoFactura.direccionComprador = input.order.customerAddress;
    }

    const factura: Record<string, unknown> = {
      '@_id': 'comprobante',
      '@_version': SRI_INVOICE_XML_VERSION,
      infoTributaria: {
        ambiente: input.environment,
        tipoEmision: '1',
        razonSocial: input.companyName,
        nombreComercial: input.companyTradeName ?? input.companyName,
        ruc: input.companyRuc,
        claveAcceso: input.accessKey,
        codDoc: '01',
        estab: input.establishmentCode.padStart(3, '0'),
        ptoEmi: input.emissionPointCode.padStart(3, '0'),
        secuencial: input.sequenceNumber.padStart(9, '0'),
        dirMatriz: input.companyAddress ?? 'Direccion matriz',
      },
      infoFactura,
      detalles: {
        detalle: input.order.items.map((item) => this.buildDetail(item)),
      },
    };

    const additionalInfo = buildAdditionalInfoFields([
      { name: 'email', value: input.order.customerEmail },
      { name: 'telefono', value: input.order.customerPhone },
    ]);
    if (additionalInfo) {
      factura.infoAdicional = additionalInfo;
    }

    return { factura };
  }

  private buildDetail(item: InvoiceItem): unknown {
    const totalWithoutTax = item.quantity * item.unitPrice - item.discount;
    const taxValue =
      item.taxAmount ?? this.calculateTax(totalWithoutTax, item.taxRate);

    return {
      codigoPrincipal: item.code,
      descripcion: item.description,
      cantidad: formatSriQuantity(item.quantity),
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
    };
  }

  private calculateTax(base: number, rate: number): number {
    return base * (rate / 100);
  }
}
