import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';

@Injectable()
export class DirectSriInvoiceProvider implements InvoiceProvider {
  private readonly logger = new Logger(DirectSriInvoiceProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly accessKeyBuilder: SriAccessKeyBuilder,
    private readonly xmlBuilder: SriXmlBuilder,
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

    const xml = this.xmlBuilder.buildFactura({
      accessKey,
      order,
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
      environment: this.getEnvironmentCode(),
      companyRuc: this.configService.getOrThrow<string>('SRI_RUC'),
      companyName: 'Empresa E-commerce',
      companyTradeName: 'E-commerce',
      companyAddress: 'Direccion matriz',
    });

    const certificatePath = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PATH',
    );
    const certificatePassword = this.configService.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PASSWORD',
    );

    const p12Buffer = this.signerService.loadCertificateFileAsBuffer(certificatePath);
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
    this.logger.warn(
      { invoiceAccessKey: returnRequest.invoiceAccessKey },
      'Credit note not implemented',
    );
    throw new NotImplementedException(
      'SRI credit note (nota de credito 04) is not implemented yet',
    );
  }

  private getEnvironmentCode(): '1' | '2' {
    return this.configService.get<string>('SRI_TEST_ENVIRONMENT') === 'true'
      ? '1'
      : '2';
  }
}
