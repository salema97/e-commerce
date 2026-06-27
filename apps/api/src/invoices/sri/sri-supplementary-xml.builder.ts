import { Injectable } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import {
  buildAdditionalInfoFields,
  formatSriAmount,
  formatSriCurrency,
  formatSriDate,
  formatSriYesNo,
  resolveBuyerIdentificationType,
  resolveEmissionDate,
} from './sri-xml.utils.js';

export type SriSupplementaryDocumentType = '05' | '06' | '07';

export interface SriSupplementaryXmlInput {
  documentType: SriSupplementaryDocumentType;
  accessKey: string;
  customerName: string;
  customerIdentification?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  parentInvoiceAccessKey?: string;
  parentInvoiceNumber?: string;
  parentInvoiceDate?: string;
  reason: string;
  totalAmount: number;
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
  vehiclePlate?: string;
  routeDescription?: string;
  departureAddress?: string;
  establishmentAddress?: string;
  shipmentDetails?: Array<{ code: string; description: string; quantity: number }>;
}

const XML_VERSION = '1.1.0';

@Injectable()
export class SriSupplementaryXmlBuilder {
  build(input: SriSupplementaryXmlInput): string {
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

  private buildDocument(input: SriSupplementaryXmlInput): unknown {
    const emissionDate = input.emissionDate ?? resolveEmissionDate(input.accessKey);
    const infoTributaria = {
      ambiente: input.environment,
      tipoEmision: '1',
      razonSocial: input.companyName,
      nombreComercial: input.companyTradeName ?? input.companyName,
      ruc: input.companyRuc,
      claveAcceso: input.accessKey,
      codDoc: input.documentType,
      estab: input.establishmentCode.padStart(3, '0'),
      ptoEmi: input.emissionPointCode.padStart(3, '0'),
      secuencial: input.sequenceNumber.padStart(9, '0'),
      dirMatriz: input.companyAddress ?? 'Direccion matriz',
    };

    const additionalInfo = buildAdditionalInfoFields([
      { name: 'email', value: input.customerEmail },
      { name: 'telefono', value: input.customerPhone },
      { name: 'motivo', value: input.reason },
    ]);

    switch (input.documentType) {
      case '05':
        return {
          notaDebito: this.wrapDocument('notaDebito', infoTributaria, {
            infoNotaDebito: this.buildDebitInfo(input, emissionDate),
            motivos: {
              motivo: {
                razon: input.reason,
                valor: formatSriAmount(input.totalAmount),
              },
            },
          }, additionalInfo),
        };
      case '06':
        return {
          guiaRemision: this.wrapDocument('guiaRemision', infoTributaria, {
            infoGuiaRemision: {
              dirEstablecimiento:
                input.establishmentAddress ?? input.companyAddress ?? 'Direccion establecimiento',
              dirPartida: input.departureAddress ?? input.companyAddress ?? 'Direccion partida',
              razonSocialTransportista: input.companyName,
              tipoIdentificacionTransportista: '04',
              rucTransportista: input.companyRuc,
              obligadoContabilidad: formatSriYesNo(input.requiresAccounting ?? false),
              fechaIniTransporte: formatSriDate(emissionDate),
              fechaFinTransporte: formatSriDate(emissionDate),
              placa: input.vehiclePlate ?? 'AAA0000',
              destinatarios: {
                destinatario: {
                  identificacionDestinatario:
                    input.customerIdentification ?? '9999999999999',
                  razonSocialDestinatario: input.customerName,
                  dirDestinatario: input.customerAddress ?? 'Direccion destino',
                  motivoTraslado: input.reason,
                  docAduaneroUnico: '000',
                  codEstabDestino: input.establishmentCode.padStart(3, '0'),
                  ruta: input.routeDescription ?? 'N/A',
                  detalles: {
                    detalle: (input.shipmentDetails?.length
                      ? input.shipmentDetails
                      : [{ code: 'ENVIO', description: input.reason, quantity: 1 }]
                    ).map((line) => ({
                      codigoInterno: line.code,
                      codigoAdicional: '001',
                      descripcion: line.description,
                      cantidad: formatSriAmount(line.quantity),
                    })),
                  },
                },
              },
            },
          }, additionalInfo),
        };
      case '07':
        return {
          comprobanteRetencion: this.wrapDocument(
            'comprobanteRetencion',
            infoTributaria,
            {
              infoCompRetencion: {
                fechaEmision: formatSriDate(emissionDate),
                dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
                obligadoContabilidad: formatSriYesNo(input.requiresAccounting ?? false),
                tipoIdentificacionSujetoRetenido: resolveBuyerIdentificationType(
                  input.customerIdentification,
                ),
                razonSocialSujetoRetenido: input.customerName,
                identificacionSujetoRetenido:
                  input.customerIdentification ?? '9999999999999',
                periodoFiscal: `${String(emissionDate.getMonth() + 1).padStart(2, '0')}/${emissionDate.getFullYear()}`,
              },
              impuestos: {
                impuesto: {
                  codigo: '1',
                  codigoRetencion: '303',
                  baseImponible: formatSriAmount(input.totalAmount),
                  porcentajeRetener: formatSriAmount(0),
                  valorRetenido: formatSriAmount(0),
                  codDocSustento: '01',
                  numDocSustento: input.parentInvoiceNumber ?? '000000000000001',
                  fechaEmisionDocSustento:
                    input.parentInvoiceDate ?? formatSriDate(emissionDate),
                },
              },
            },
            additionalInfo,
          ),
        };
      default:
        throw new Error(`Unsupported supplementary document type: ${input.documentType satisfies never}`);
    }
  }

  private buildDebitInfo(input: SriSupplementaryXmlInput, emissionDate: Date) {
    const info: Record<string, unknown> = {
      fechaEmision: formatSriDate(emissionDate),
      dirEstablecimiento: input.companyAddress ?? 'Direccion establecimiento',
      obligadoContabilidad: formatSriYesNo(input.requiresAccounting ?? false),
      tipoIdentificacionComprador: resolveBuyerIdentificationType(
        input.customerIdentification,
      ),
      razonSocialComprador: input.customerName,
      identificacionComprador: input.customerIdentification ?? '9999999999999',
      codDocModificado: '01',
      numDocModificado: input.parentInvoiceNumber ?? '001-001-000000001',
      fechaEmisionDocumentoModificado:
        input.parentInvoiceDate ?? formatSriDate(emissionDate),
      totalSinImpuestos: formatSriAmount(input.totalAmount),
      valorTotal: formatSriAmount(input.totalAmount),
      moneda: formatSriCurrency('USD'),
    };

    if (input.customerAddress) {
      info.direccionComprador = input.customerAddress;
    }

    return info;
  }

  private wrapDocument(
    _root: string,
    infoTributaria: Record<string, unknown>,
    body: Record<string, unknown>,
    additionalInfo?: unknown,
  ): Record<string, unknown> {
    return {
      '@_id': 'comprobante',
      '@_version': XML_VERSION,
      infoTributaria,
      ...body,
      ...(additionalInfo ? { infoAdicional: additionalInfo } : {}),
    };
  }
}
