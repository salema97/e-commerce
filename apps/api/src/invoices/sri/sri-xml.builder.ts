import { Injectable, Logger } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import { InvoiceOrder, InvoiceItem } from '../invoice-provider.interface.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';

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
}

@Injectable()
export class SriXmlBuilder {
  private readonly logger = new Logger(SriXmlBuilder.name);

  constructor(private readonly accessKeyBuilder: SriAccessKeyBuilder) {}

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
    return {
      factura: {
        '@_id': 'comprobante',
        '@_version': '2.3.2',
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
        infoFactura: {
          fechaEmision: this.formatDate(new Date()),
          dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
          obligadoContabilidad: 'SI',
          tipoIdentificacionComprador: this.identificationType(
            input.order.customerIdentification,
          ),
          razonSocialComprador: input.order.customerName,
          identificacionComprador: input.order.customerIdentification ?? '9999999999',
          direccionComprador: input.order.customerAddress ?? 'Direccion comprador',
          totalSinImpuestos: this.formatNumber(input.order.subtotal),
          totalDescuento: this.formatNumber(input.order.discountAmount),
          totalConImpuestos: {
            totalImpuesto: {
              codigo: '2',
              codigoPorcentaje: '4',
              baseImponible: this.formatNumber(input.order.subtotal - input.order.discountAmount),
              valor: this.formatNumber(input.order.taxAmount),
            },
          },
          propina: '0.00',
          importeTotal: this.formatNumber(input.order.total),
          moneda: this.formatCurrency(input.order.currency),
        },
        detalles: {
          detalle: input.order.items.map((item) => this.buildDetail(item)),
        },
        infoAdicional: this.buildAdditionalInfo(input.order),
      },
    };
  }

  private buildDetail(item: InvoiceItem): unknown {
    const totalWithoutTax = (item.quantity * item.unitPrice) - item.discount;
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
          valor: this.formatNumber(this.calculateTax(totalWithoutTax, item.taxRate)),
        },
      },
    };
  }

  private buildAdditionalInfo(order: InvoiceOrder): unknown {
    const fields: Array<{ campoAdicional: string; '@_nombre': string }> = [];
    if (order.customerEmail) {
      fields.push({ campoAdicional: order.customerEmail, '@_nombre': 'email' });
    }
    if (order.customerPhone) {
      fields.push({ campoAdicional: order.customerPhone, '@_nombre': 'telefono' });
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
}
