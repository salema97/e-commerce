import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, CreditNoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InvoiceStatus } from '../invoice-status.enum.js';
import {
  CreditNoteInput,
  InvoiceOrder,
  InvoiceProvider,
  InvoiceResult,
} from '../invoice-provider.interface.js';
import { InvoiceSequenceService } from '../invoice-sequence.service.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { SriXmlBuilder } from './sri-xml.builder.js';
import { SriCreditNoteXmlBuilder } from './sri-credit-note-xml.builder.js';
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';

@Injectable()
export class DirectSriInvoiceProvider implements InvoiceProvider {
  private readonly logger = new Logger(DirectSriInvoiceProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly accessKeyBuilder: SriAccessKeyBuilder,
    private readonly xmlBuilder: SriXmlBuilder,
    private readonly creditNoteXmlBuilder: SriCreditNoteXmlBuilder,
    private readonly signerService: SriSignerService,
    private readonly soapClient: SriSoapClient,
    private readonly invoiceSequenceService: InvoiceSequenceService,
  ) {}

  async issueInvoice(order: InvoiceOrder): Promise<InvoiceResult> {
    const establishmentCode = this.configService.getOrThrow<string>(
      'SRI_ESTABLISHMENT_CODE',
    );
    const emissionPointCode = this.configService.getOrThrow<string>(
      'SRI_EMISSION_POINT_CODE',
    );

    const sequenceNumber =
      await this.invoiceSequenceService.allocateNext(
        '01',
        establishmentCode,
        emissionPointCode,
      );

    const accessKey = this.accessKeyBuilder.build({
      date: new Date(),
      documentType: '01',
      ruc: this.configService.getOrThrow<string>('SRI_RUC'),
      environment: this.getEnvironmentCode(),
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
    });

    const companyName = this.configService.getOrThrow<string>('SRI_COMPANY_NAME');
    const companyTradeName = this.configService.get<string>('SRI_COMPANY_TRADE_NAME') ?? companyName;
    const companyAddress = this.configService.get<string>('SRI_COMPANY_ADDRESS') ?? 'Direccion matriz';

    const xml = this.xmlBuilder.buildFactura({
      accessKey,
      order,
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
      environment: this.getEnvironmentCode(),
      companyRuc: this.configService.getOrThrow<string>('SRI_RUC'),
      companyName,
      companyTradeName,
      companyAddress,
    });

    const certificatePath = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PATH',
    );
    const certificatePassword = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PASSWORD',
    );

    const p12Buffer = await this.signerService.loadCertificateFileAsBuffer(certificatePath);
    const signedXml = this.signerService.sign(
      xml,
      p12Buffer,
      certificatePassword,
    );

    const reception = await this.soapClient.submit(signedXml);

    if (reception.estado !== 'RECIBIDA') {
      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        xmlContent: signedXml,
        sriResponse: reception,
      };
    }

    const authorization = await this.soapClient.poll(accessKey);
    const auth = authorization.autorizaciones?.[0];

    if (auth?.estado === 'AUTORIZADO') {
      return {
        accessKey,
        authorizationNumber: auth.numeroAutorizacion,
        status: InvoiceStatus.AUTHORIZED,
        xmlContent: signedXml,
        sriResponse: authorization,
      };
    }

    if (auth?.estado === 'RECHAZADO') {
      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        xmlContent: signedXml,
        sriResponse: authorization,
      };
    }

    return {
      accessKey,
      status: InvoiceStatus.SUBMITTED,
      xmlContent: signedXml,
      sriResponse: authorization,
    };
  }

  async getInvoiceStatus(accessKey: string): Promise<InvoiceStatus> {
    const authorization = await this.soapClient.queryStatus(accessKey);
    const auth = authorization.autorizaciones?.[0];

    if (auth?.estado === 'AUTORIZADO') return InvoiceStatus.AUTHORIZED;
    if (auth?.estado === 'RECHAZADO') return InvoiceStatus.REJECTED;
    return InvoiceStatus.SUBMITTED;
  }

  async issueCreditNote(returnRequest: CreditNoteInput): Promise<InvoiceResult> {
    const establishmentCode = this.configService.getOrThrow<string>(
      'SRI_ESTABLISHMENT_CODE',
    );
    const emissionPointCode = this.configService.getOrThrow<string>(
      'SRI_EMISSION_POINT_CODE',
    );

    const sequenceNumber =
      await this.invoiceSequenceService.allocateNext(
        '04',
        establishmentCode,
        emissionPointCode,
      );

    const accessKey = this.accessKeyBuilder.build({
      date: new Date(),
      documentType: '04',
      ruc: this.configService.getOrThrow<string>('SRI_RUC'),
      environment: this.getEnvironmentCode(),
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
    });

    const returnRecord = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequest.returnRequestId },
      include: { order: true },
    });

    if (!returnRecord) {
      throw new Error(
        `Return request ${returnRequest.returnRequestId} not found`,
      );
    }

    const companyName = this.configService.getOrThrow<string>('SRI_COMPANY_NAME');
    const companyTradeName = this.configService.get<string>('SRI_COMPANY_TRADE_NAME') ?? companyName;
    const companyAddress = this.configService.get<string>('SRI_COMPANY_ADDRESS') ?? 'Direccion matriz';

    const xml = this.creditNoteXmlBuilder.buildNotaDeCredito({
      accessKey,
      customerName: returnRecord.order.customerName ?? returnRecord.order.customerEmail,
      customerIdentification: returnRecord.order.customerIdentification ?? undefined,
      customerEmail: returnRecord.order.customerEmail,
      customerPhone: returnRecord.order.customerPhone ?? undefined,
      customerAddress: returnRecord.order.customerAddress ?? undefined,
      creditNote: returnRequest,
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
      environment: this.getEnvironmentCode(),
      companyRuc: this.configService.getOrThrow<string>('SRI_RUC'),
      companyName,
      companyTradeName,
      companyAddress,
    });

    const certificatePath = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PATH',
    );
    const certificatePassword = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PASSWORD',
    );

    const p12Buffer = await this.signerService.loadCertificateFileAsBuffer(certificatePath);
    const signedXml = this.signerService.sign(xml, p12Buffer, certificatePassword);

    const reception = await this.soapClient.submit(signedXml);

    if (reception.estado !== 'RECIBIDA') {
      const creditNote = await this.persistCreditNote({
        accessKey,
        returnRequestId: returnRequest.returnRequestId,
        parentInvoiceAccessKey: returnRequest.parentInvoiceAccessKey,
        total: returnRequest.total,
        signedXml,
        status: InvoiceStatus.REJECTED,
        sriResponse: reception,
      });

      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        xmlContent: signedXml,
        sriResponse: reception,
      };
    }

    const authorization = await this.soapClient.poll(accessKey);
    const auth = authorization.autorizaciones?.[0];

    if (auth?.estado === 'AUTORIZADO') {
      await this.persistCreditNote({
        accessKey,
        returnRequestId: returnRequest.returnRequestId,
        parentInvoiceAccessKey: returnRequest.parentInvoiceAccessKey,
        total: returnRequest.total,
        signedXml,
        status: InvoiceStatus.AUTHORIZED,
        authorizationNumber: auth.numeroAutorizacion,
        sriResponse: authorization,
      });

      return {
        accessKey,
        authorizationNumber: auth.numeroAutorizacion,
        status: InvoiceStatus.AUTHORIZED,
        xmlContent: signedXml,
        sriResponse: authorization,
      };
    }

    if (auth?.estado === 'RECHAZADO') {
      await this.persistCreditNote({
        accessKey,
        returnRequestId: returnRequest.returnRequestId,
        parentInvoiceAccessKey: returnRequest.parentInvoiceAccessKey,
        total: returnRequest.total,
        signedXml,
        status: InvoiceStatus.REJECTED,
        sriResponse: authorization,
      });

      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        xmlContent: signedXml,
        sriResponse: authorization,
      };
    }

    await this.persistCreditNote({
      accessKey,
      returnRequestId: returnRequest.returnRequestId,
      parentInvoiceAccessKey: returnRequest.parentInvoiceAccessKey,
      total: returnRequest.total,
      signedXml,
      status: InvoiceStatus.SUBMITTED,
      sriResponse: authorization,
    });

    return {
      accessKey,
      status: InvoiceStatus.SUBMITTED,
      xmlContent: signedXml,
      sriResponse: authorization,
    };
  }

  private async persistCreditNote(input: {
    accessKey: string;
    returnRequestId: string;
    parentInvoiceAccessKey?: string;
    total: number;
    signedXml: string;
    status: InvoiceStatus;
    authorizationNumber?: string;
    sriResponse?: unknown;
  }) {
    const creditNoteStatus = input.status as CreditNoteStatus;

    const creditNote = await this.prisma.creditNote.create({
      data: {
        accessKey: input.accessKey,
        parentInvoiceAccessKey: input.parentInvoiceAccessKey ?? null,
        status: creditNoteStatus,
        signedXml: input.signedXml,
        totalAmount: new Prisma.Decimal(input.total),
        authorizationNumber: input.authorizationNumber ?? null,
        sriResponse: input.sriResponse
          ? (input.sriResponse as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    await this.prisma.returnRequest.update({
      where: { id: input.returnRequestId },
      data: { creditNoteId: creditNote.id },
    });

    this.logger.log(
      {
        creditNoteId: creditNote.id,
        accessKey: input.accessKey,
        returnRequestId: input.returnRequestId,
        status: input.status,
      },
      'Credit note persisted',
    );

    return creditNote;
  }

  private getEnvironmentCode(): '1' | '2' {
    return this.configService.get<string>('SRI_TEST_ENVIRONMENT') === 'true'
      ? '1'
      : '2';
  }
}
