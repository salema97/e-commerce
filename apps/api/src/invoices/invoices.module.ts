import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { InvoicesController } from './invoices.controller.js';
import { CreditNotesController } from './credit-notes.controller.js';
import { TestInvoicesController } from './test-invoices.controller.js';
import { InvoiceProviderFactory } from './invoice-provider.factory.js';
import { DirectSriInvoiceProvider } from './sri/sri-invoice.provider.js';
import { SriAccessKeyBuilder } from './sri/sri-access-key.builder.js';
import { SriXmlBuilder } from './sri/sri-xml.builder.js';
import { SriSignerService } from './sri/sri-signer.service.js';
import { SriSoapClient } from './sri/sri-soap.client.js';
import { InvoiceSequenceService } from './invoice-sequence.service.js';
import { SriCreditNoteXmlBuilder } from './sri/sri-credit-note-xml.builder.js';
import { SriRidePdfService } from './sri/sri-ride-pdf.service.js';
import { SriDocumentStorageService } from './sri/sri-document-storage.service.js';
import { SriDeliveryService } from './sri/sri-delivery.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { EmailModule } from '../notifications/email.module.js';
import { WhatsAppNotificationModule } from '../whatsapp/whatsapp-notification.module.js';
import { SriQueueModule } from './sri/sri-queue.module.js';
import { SriQueueWorker } from './sri/sri-queue.worker.js';
import { isNonProduction } from '../common/is-non-production.js';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    EmailModule,
    WhatsAppNotificationModule,
    SriQueueModule,
  ],
  controllers: [
    InvoicesController,
    CreditNotesController,
    ...(isNonProduction() ? [TestInvoicesController] : []),
  ],
  providers: [
    InvoicesService,
    InvoiceProviderFactory,
    DirectSriInvoiceProvider,
    SriAccessKeyBuilder,
    SriXmlBuilder,
    SriCreditNoteXmlBuilder,
    SriSignerService,
    SriSoapClient,
    InvoiceSequenceService,
    SriRidePdfService,
    SriDocumentStorageService,
    SriDeliveryService,
    SriQueueWorker,
  ],
  exports: [
    InvoicesService,
    InvoiceProviderFactory,
    InvoiceSequenceService,
    DirectSriInvoiceProvider,
    SriAccessKeyBuilder,
    SriXmlBuilder,
    SriCreditNoteXmlBuilder,
    SriSignerService,
    SriSoapClient,
    SriRidePdfService,
    SriDocumentStorageService,
    SriDeliveryService,
  ],
})
export class InvoicesModule {}
