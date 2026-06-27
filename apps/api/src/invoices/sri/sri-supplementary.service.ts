import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditNoteStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';
import { InvoiceSequenceService } from '../invoice-sequence.service.js';
import {
  SriSupplementaryXmlBuilder,
  type SriSupplementaryDocumentType,
} from './sri-supplementary-xml.builder.js';
import {
  mapSriCompanyToXmlFields,
  readSriCompanyConfig,
} from './sri-company.config.js';
import { formatSriDate } from './sri-xml.utils.js';
import { IssueSupplementaryDocumentDto } from '../dto/issue-supplementary-document.dto.js';
import { InvoiceStatus } from '../invoice-status.enum.js';
import { parseOrderShippingAddress } from '../../shipping/servientrega/servientrega-order.util.js';

function formatShippingAddressLine(value: unknown): string | undefined {
  const address = parseOrderShippingAddress(value);
  if (!address) return undefined;
  return [address.street, address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(', ');
}

@Injectable()
export class SriSupplementaryService {
  private readonly logger = new Logger(SriSupplementaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly accessKeyBuilder: SriAccessKeyBuilder,
    private readonly xmlBuilder: SriSupplementaryXmlBuilder,
    private readonly signerService: SriSignerService,
    private readonly soapClient: SriSoapClient,
    private readonly invoiceSequenceService: InvoiceSequenceService,
  ) {}

  async issue(dto: IssueSupplementaryDocumentDto) {
    const documentType = dto.documentType as SriSupplementaryDocumentType;
    if (!['05', '06', '07'].includes(documentType)) {
      throw new BadRequestException('documentType must be 05, 06, or 07');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { invoice: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    if (dto.shipmentId) {
      const existing = await this.prisma.sriSupplementaryDocument.findUnique({
        where: { shipmentId: dto.shipmentId },
      });
      if (existing) {
        return {
          id: existing.id,
          documentType: existing.documentType,
          accessKey: existing.accessKey,
          status: existing.status as unknown as InvoiceStatus,
          authorizationNumber: existing.authorizationNumber ?? undefined,
        };
      }
    }

    const parentAccessKey =
      dto.parentInvoiceAccessKey ?? order.invoice?.accessKey ?? undefined;
    if ((documentType === '05' || documentType === '07') && !parentAccessKey) {
      throw new BadRequestException(
        'parentInvoiceAccessKey is required for debit notes and withholding certificates',
      );
    }

    const establishmentCode = this.configService.getOrThrow<string>('SRI_ESTABLISHMENT_CODE');
    const emissionPointCode = this.configService.getOrThrow<string>('SRI_EMISSION_POINT_CODE');
    const sequenceNumber = await this.invoiceSequenceService.allocateNext(
      documentType,
      establishmentCode,
      emissionPointCode,
    );

    const emissionDate = new Date();
    const accessKey = this.accessKeyBuilder.build({
      date: emissionDate,
      documentType,
      ruc: this.configService.getOrThrow<string>('SRI_RUC'),
      environment: this.getEnvironmentCode(),
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
    });

    const company = readSriCompanyConfig(this.configService);
    const totalAmount = dto.totalAmount ?? Number(order.total);
    const shippingAddress = parseOrderShippingAddress(order.shippingAddress);
    const customerName =
      (documentType === '06' && shippingAddress?.recipientName) ||
      order.customerName ||
      order.customerEmail;
    const customerAddress =
      (documentType === '06' && formatShippingAddressLine(order.shippingAddress)) ||
      order.customerAddress ||
      undefined;

    let shipmentDetails:
      | Array<{ code: string; description: string; quantity: number }>
      | undefined;
    if (documentType === '06' && dto.shipmentId) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { id: dto.shipmentId },
        include: { items: { include: { orderItem: true } } },
      });
      if (!shipment) {
        throw new NotFoundException(`Shipment ${dto.shipmentId} not found`);
      }
      shipmentDetails = shipment.items.map((line) => ({
        code: line.orderItem.sku,
        description: line.orderItem.name,
        quantity: line.quantity,
      }));
    }

    const xml = this.xmlBuilder.build({
      documentType,
      accessKey,
      customerName,
      customerIdentification: order.customerIdentification ?? undefined,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone ?? undefined,
      customerAddress,
      parentInvoiceAccessKey: parentAccessKey,
      parentInvoiceNumber: order.invoice?.sequenceNumber ?? undefined,
      parentInvoiceDate: order.invoice?.authorizationDate
        ? formatSriDate(order.invoice.authorizationDate)
        : undefined,
      reason: dto.reason ?? `Documento ${documentType} para pedido ${order.orderNumber}`,
      totalAmount,
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
      environment: this.getEnvironmentCode(),
      emissionDate,
      vehiclePlate: this.configService.get<string>('SERVIENTREGA_VEHICLE_PLATE') ?? undefined,
      routeDescription: dto.carrierGuideNumber
        ? `Servientrega ${dto.carrierGuideNumber}`
        : undefined,
      departureAddress:
        this.configService.get<string>('SERVIENTREGA_ORIGIN_STREET') ?? company.address,
      establishmentAddress: company.address,
      shipmentDetails,
      ...mapSriCompanyToXmlFields(company),
    });

    const certificatePath = this.configService.getOrThrow<string>('SRI_DIGITAL_CERTIFICATE_PATH');
    const certificatePassword = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PASSWORD',
    );
    const p12Buffer = await this.signerService.loadCertificateFileAsBuffer(certificatePath);
    const signedXml = this.signerService.sign(xml, p12Buffer, certificatePassword);

    const reception = await this.soapClient.submit(signedXml);
    let status: CreditNoteStatus = CreditNoteStatus.SUBMITTED;
    let authorizationNumber: string | undefined;

    if (reception.estado !== 'RECIBIDA') {
      status = CreditNoteStatus.REJECTED;
    } else {
      const authorization = await this.soapClient.poll(accessKey);
      const auth = authorization.autorizaciones?.[0];
      if (auth?.estado === 'AUTORIZADO') {
        status = CreditNoteStatus.AUTHORIZED;
        authorizationNumber = auth.numeroAutorizacion;
      } else if (auth?.estado === 'RECHAZADO') {
        status = CreditNoteStatus.REJECTED;
      }
    }

    const record = await this.prisma.sriSupplementaryDocument.create({
      data: {
        documentType,
        accessKey,
        orderId: order.id,
        parentInvoiceAccessKey: parentAccessKey ?? null,
        sequenceNumber,
        authorizationNumber: authorizationNumber ?? null,
        authorizationDate: authorizationNumber ? new Date() : null,
        status,
        signedXml,
        reason: dto.reason ?? null,
        totalAmount: new Prisma.Decimal(totalAmount),
        sriResponse: reception as unknown as Prisma.InputJsonValue,
        shipmentId: dto.shipmentId ?? null,
        carrierGuideNumber: dto.carrierGuideNumber ?? null,
      },
    });

    this.logger.log(
      { id: record.id, documentType, accessKey, status },
      'SRI supplementary document issued',
    );

    return {
      id: record.id,
      documentType,
      accessKey,
      status: status as unknown as InvoiceStatus,
      authorizationNumber,
    };
  }

  async findByShipmentId(shipmentId: string) {
    return this.prisma.sriSupplementaryDocument.findUnique({
      where: { shipmentId },
    });
  }

  async findAll(documentType?: string) {
    return this.prisma.sriSupplementaryDocument.findMany({
      where: documentType ? { documentType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private getEnvironmentCode(): '1' | '2' {
    const testEnv = this.configService.get<string>('SRI_TEST_ENVIRONMENT');
    return testEnv === 'false' ? '1' : '2';
  }
}
