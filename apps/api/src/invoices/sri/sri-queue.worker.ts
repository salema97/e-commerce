import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SriDocumentJobStatus } from '@prisma/client';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InvoiceSequenceService } from '../invoice-sequence.service.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { SriXmlBuilder } from './sri-xml.builder.js';
import { SriCreditNoteXmlBuilder } from './sri-credit-note-xml.builder.js';
import { SriSignerService } from './sri-signer.service.js';
import { SriSoapClient } from './sri-soap.client.js';
import { SRI_QUEUE_NAME } from './sri-queue.config.js';
import {
  IssueCreditNoteJobData,
  IssueInvoiceJobData,
  ReconcileDocumentJobData,
  SriJobName,
  SriQueueJobData,
} from './sri-queue.types.js';
import { InvoiceOrder, CreditNoteInput, CreditNoteItem } from '../invoice-provider.interface.js';
import { InvoiceStatus } from '../invoice-status.enum.js';

interface ProcessResult {
  accessKey: string;
  status: InvoiceStatus;
  authorizationNumber?: string;
  authorizationDate?: Date;
  sequenceNumber: string;
  signedXml: string;
  sriResponse: unknown;
}

@Injectable()
export class SriQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SriQueueWorker.name);
  private worker: Worker | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sequenceService: InvoiceSequenceService,
    private readonly accessKeyBuilder: SriAccessKeyBuilder,
    private readonly xmlBuilder: SriXmlBuilder,
    private readonly creditNoteXmlBuilder: SriCreditNoteXmlBuilder,
    private readonly signerService: SriSignerService,
    private readonly soapClient: SriSoapClient,
  ) {}

  onModuleInit(): void {
    const concurrency = this.config.get<number>('sriQueue.concurrency', 5);

    this.worker = new Worker(
      SRI_QUEUE_NAME,
      (job) => this.process(job),
      {
        connection: {
          url: this.config.getOrThrow<string>('REDIS_URL'),
        },
        concurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        { jobId: job?.id, error: error.message },
        'SRI queue job failed',
      );
    });

    this.worker.on('completed', (job) => {
      this.logger.log({ jobId: job.id }, 'SRI queue job completed');
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async process(job: Job<SriQueueJobData>): Promise<void> {
    const jobRecord = await this.prisma.sriDocumentJob.findUnique({
      where: { jobId: String(job.id) },
    });

    if (!jobRecord) {
      this.logger.warn({ jobId: job.id }, 'SRI document job record not found');
      return;
    }

    await this.updateJobStatus(jobRecord.id, SriDocumentJobStatus.RUNNING);

    try {
      let result: ProcessResult;

      switch (job.name as SriJobName) {
        case SriJobName.ISSUE_INVOICE:
          result = await this.processInvoiceJob(job as Job<IssueInvoiceJobData>);
          break;
        case SriJobName.ISSUE_CREDIT_NOTE:
          result = await this.processCreditNoteJob(
            job as Job<IssueCreditNoteJobData>,
          );
          break;
        case SriJobName.RECONCILE_DOCUMENT:
          await this.processReconcileJob(job as Job<ReconcileDocumentJobData>);
          await this.updateJobStatus(jobRecord.id, SriDocumentJobStatus.COMPLETED);
          return;
        default:
          throw new Error(`Unknown SRI job name: ${job.name}`);
      }

      await this.persistDocumentResult(jobRecord.documentType, jobRecord.documentId, result);
      await this.updateJobStatus(jobRecord.id, SriDocumentJobStatus.COMPLETED);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      await this.prisma.sriDocumentJob.update({
        where: { id: jobRecord.id },
        data: {
          status: isFinalAttempt
            ? SriDocumentJobStatus.DLQ
            : SriDocumentJobStatus.FAILED,
          attempts: job.attemptsMade + 1,
          lastError: message,
        },
      });

      this.logger.error(
        {
          jobId: job.id,
          documentType: jobRecord.documentType,
          documentId: jobRecord.documentId,
          attempt: job.attemptsMade + 1,
          isFinalAttempt,
          error: message,
        },
        'SRI document job processing failed',
      );

      throw error;
    }
  }

  private async processInvoiceJob(
    job: Job<IssueInvoiceJobData>,
  ): Promise<ProcessResult> {
    const { orderId } = job.data;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const invoiceOrder: InvoiceOrder = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerEmail,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone ?? undefined,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      total: Number(order.total),
      currency: 'USD',
      items: order.items.map((item) => ({
        code: item.sku,
        description: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        discount: 0,
        taxRate: 15,
      })),
    };

    return this.issueDocument('01', (accessKey, sequenceNumber, signedXml) => {
      const xml = this.xmlBuilder.buildFactura({
        accessKey,
        order: invoiceOrder,
        establishmentCode: this.config.getOrThrow<string>(
          'SRI_ESTABLISHMENT_CODE',
        ),
        emissionPointCode: this.config.getOrThrow<string>(
          'SRI_EMISSION_POINT_CODE',
        ),
        sequenceNumber,
        environment: this.getEnvironmentCode(),
        companyRuc: this.config.getOrThrow<string>('SRI_RUC'),
        companyName: this.config.getOrThrow<string>('SRI_COMPANY_NAME'),
        companyTradeName:
          this.config.get<string>('SRI_COMPANY_TRADE_NAME') ??
          this.config.getOrThrow<string>('SRI_COMPANY_NAME'),
        companyAddress:
          this.config.get<string>('SRI_COMPANY_ADDRESS') ??
          'Direccion matriz',
      });

      return xml;
    });
  }

  private async processCreditNoteJob(
    job: Job<IssueCreditNoteJobData>,
  ): Promise<ProcessResult> {
    const { creditNoteId } = job.data;

    const creditNote = await this.prisma.creditNote.findUnique({
      where: { id: creditNoteId },
      include: {
        returnRequest: {
          include: {
            order: { include: { items: true, invoice: true } },
            items: true,
          },
        },
      },
    });

    if (!creditNote) {
      throw new Error(`Credit note ${creditNoteId} not found`);
    }

    if (!creditNote.returnRequest) {
      throw new Error(`Credit note ${creditNoteId} has no return request`);
    }

    const returnRequest = creditNote.returnRequest;
    const originalInvoice = returnRequest.order.invoice;

    if (!originalInvoice) {
      throw new Error(
        `No invoice found for order ${returnRequest.order.id}`,
      );
    }

    const items: CreditNoteItem[] = returnRequest.items.map((item) => {
      const orderItem = returnRequest.order.items.find(
        (oi) =>
          oi.productId === item.productId &&
          oi.variantId === item.productVariantId,
      );
      const unitPrice = orderItem ? Number(orderItem.price) : 0;
      return {
        code: orderItem?.sku ?? item.productId,
        description: orderItem?.name ?? item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: 0,
        taxRate: 15,
        reason: returnRequest.reason,
      };
    });

    const total = Number(creditNote.totalAmount);

    const creditNoteInput: CreditNoteInput = {
      returnRequestId: returnRequest.id,
      invoiceAccessKey: originalInvoice.accessKey,
      parentInvoiceAccessKey: originalInvoice.accessKey,
      authorizationNumber: originalInvoice.authorizationNumber ?? undefined,
      codDocModificado: '01',
      numDocModificado: originalInvoice.accessKey,
      fechaEmisionDocumentoModificado: this.formatDate(originalInvoice.createdAt),
      reason: returnRequest.reason,
      items,
      total,
    };

    return this.issueDocument('04', (accessKey, sequenceNumber, signedXml) => {
      const xml = this.creditNoteXmlBuilder.buildNotaDeCredito({
        accessKey,
        customerName: returnRequest.order.customerEmail,
        customerEmail: returnRequest.order.customerEmail,
        customerPhone: returnRequest.order.customerPhone ?? undefined,
        creditNote: creditNoteInput,
        establishmentCode: this.config.getOrThrow<string>(
          'SRI_ESTABLISHMENT_CODE',
        ),
        emissionPointCode: this.config.getOrThrow<string>(
          'SRI_EMISSION_POINT_CODE',
        ),
        sequenceNumber,
        environment: this.getEnvironmentCode(),
        companyRuc: this.config.getOrThrow<string>('SRI_RUC'),
        companyName: this.config.getOrThrow<string>('SRI_COMPANY_NAME'),
        companyTradeName:
          this.config.get<string>('SRI_COMPANY_TRADE_NAME') ??
          this.config.getOrThrow<string>('SRI_COMPANY_NAME'),
        companyAddress:
          this.config.get<string>('SRI_COMPANY_ADDRESS') ??
          'Direccion matriz',
      });

      return xml;
    });
  }

  private async issueDocument(
    documentType: '01' | '04',
    buildXml: (
      accessKey: string,
      sequenceNumber: string,
      signedXml: string,
    ) => string,
  ): Promise<ProcessResult> {
    const establishmentCode = this.config.getOrThrow<string>(
      'SRI_ESTABLISHMENT_CODE',
    );
    const emissionPointCode = this.config.getOrThrow<string>(
      'SRI_EMISSION_POINT_CODE',
    );

    const sequenceNumber = await this.sequenceService.allocateNext(
      documentType,
      establishmentCode,
      emissionPointCode,
    );

    const accessKey = this.accessKeyBuilder.build({
      date: new Date(),
      documentType,
      ruc: this.config.getOrThrow<string>('SRI_RUC'),
      environment: this.getEnvironmentCode(),
      establishmentCode,
      emissionPointCode,
      sequenceNumber,
    });

    const xml = buildXml(accessKey, sequenceNumber, '');

    const certificatePath = this.config.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PATH',
    );
    const certificatePassword = this.config.getOrThrow<string>(
      'SRI_DIGITAL_CERTIFICATE_PASSWORD',
    );

    const p12Buffer = this.signerService.loadCertificateFileAsBuffer(certificatePath);
    const signedXml = this.signerService.sign(xml, p12Buffer, certificatePassword);

    const reception = await this.soapClient.submit(signedXml);

    if (reception.estado !== 'RECIBIDA') {
      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        sequenceNumber,
        signedXml,
        sriResponse: reception,
      };
    }

    const authorization = await this.soapClient.poll(accessKey);
    const auth = authorization.autorizaciones?.[0];

    if (auth?.estado === 'AUTORIZADO') {
      return {
        accessKey,
        status: InvoiceStatus.AUTHORIZED,
        authorizationNumber: auth.numeroAutorizacion,
        authorizationDate: auth.fechaAutorizacion
          ? new Date(auth.fechaAutorizacion)
          : undefined,
        sequenceNumber,
        signedXml,
        sriResponse: authorization,
      };
    }

    if (auth?.estado === 'RECHAZADO') {
      return {
        accessKey,
        status: InvoiceStatus.REJECTED,
        sequenceNumber,
        signedXml,
        sriResponse: authorization,
      };
    }

    return {
      accessKey,
      status: InvoiceStatus.SUBMITTED,
      sequenceNumber,
      signedXml,
      sriResponse: authorization,
    };
  }

  private async processReconcileJob(
    job: Job<ReconcileDocumentJobData>,
  ): Promise<void> {
    const { documentType, documentId } = job.data;

    if (documentType === '01') {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: documentId },
      });
      if (!invoice) return;

      const status = await this.querySriStatus(invoice.accessKey);
      await this.updateInvoiceStatus(invoice.id, status);
    } else if (documentType === '04') {
      const creditNote = await this.prisma.creditNote.findUnique({
        where: { id: documentId },
      });
      if (!creditNote) return;

      const status = await this.querySriStatus(creditNote.accessKey);
      await this.updateCreditNoteStatus(creditNote.id, status);
    }
  }

  private async querySriStatus(accessKey: string): Promise<InvoiceStatus> {
    const authorization = await this.soapClient.queryStatus(accessKey);
    const auth = authorization.autorizaciones?.[0];

    if (auth?.estado === 'AUTORIZADO') return InvoiceStatus.AUTHORIZED;
    if (auth?.estado === 'RECHAZADO') return InvoiceStatus.REJECTED;
    return InvoiceStatus.SUBMITTED;
  }

  private async persistDocumentResult(
    documentType: string,
    documentId: string,
    result: ProcessResult,
  ): Promise<void> {
    const sriStatus = this.mapInvoiceStatusToSriStatus(result.status);

    if (documentType === '01') {
      await this.prisma.invoice.upsert({
        where: { orderId: documentId },
        create: {
          orderId: documentId,
          accessKey: result.accessKey,
          documentType: '01',
          sequenceNumber: result.sequenceNumber,
          authorizationNumber: result.authorizationNumber ?? null,
          authorizationDate: result.authorizationDate ?? null,
          status: result.status,
          sriStatus,
          xmlContent: result.signedXml,
          sriResponse: result.sriResponse
            ? (result.sriResponse as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        update: {
          sequenceNumber: result.sequenceNumber,
          authorizationNumber: result.authorizationNumber ?? null,
          authorizationDate: result.authorizationDate ?? null,
          status: result.status,
          sriStatus,
          xmlContent: result.signedXml,
          sriResponse: result.sriResponse
            ? (result.sriResponse as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          retryCount: { increment: 1 },
          lastError: null,
        },
      });
    } else if (documentType === '04') {
      await this.prisma.creditNote.update({
        where: { id: documentId },
        data: {
          accessKey: result.accessKey,
          sequenceNumber: result.sequenceNumber,
          authorizationNumber: result.authorizationNumber ?? null,
          authorizationDate: result.authorizationDate ?? null,
          status: this.mapInvoiceStatusToCreditNoteStatus(result.status),
          sriStatus,
          signedXml: result.signedXml,
          xmlContent: result.signedXml,
          sriResponse: result.sriResponse
            ? (result.sriResponse as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          retryCount: { increment: 1 },
          lastError: null,
        },
      });
    }
  }

  private async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<void> {
    await this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        sriStatus: this.mapInvoiceStatusToSriStatus(status),
      },
    });
  }

  private async updateCreditNoteStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<void> {
    await this.prisma.creditNote.update({
      where: { id },
      data: {
        status: this.mapInvoiceStatusToCreditNoteStatus(status),
        sriStatus: this.mapInvoiceStatusToSriStatus(status),
      },
    });
  }

  private async updateJobStatus(
    id: string,
    status: SriDocumentJobStatus,
  ): Promise<void> {
    await this.prisma.sriDocumentJob.update({
      where: { id },
      data: { status },
    });
  }

  private getEnvironmentCode(): '1' | '2' {
    return this.config.get<string>('SRI_TEST_ENVIRONMENT') === 'true'
      ? '1'
      : '2';
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private mapInvoiceStatusToSriStatus(status: InvoiceStatus) {
    switch (status) {
      case InvoiceStatus.AUTHORIZED:
        return 'AUTHORIZED' as const;
      case InvoiceStatus.REJECTED:
        return 'REJECTED' as const;
      case InvoiceStatus.SUBMITTED:
        return 'SUBMITTED' as const;
      case InvoiceStatus.FAILED:
        return 'FAILED' as const;
      default:
        return 'PENDING' as const;
    }
  }

  private mapInvoiceStatusToCreditNoteStatus(status: InvoiceStatus) {
    switch (status) {
      case InvoiceStatus.AUTHORIZED:
        return 'AUTHORIZED' as const;
      case InvoiceStatus.REJECTED:
        return 'REJECTED' as const;
      case InvoiceStatus.SUBMITTED:
        return 'SUBMITTED' as const;
      case InvoiceStatus.FAILED:
        return 'FAILED' as const;
      default:
        return 'DRAFT' as const;
    }
  }
}
