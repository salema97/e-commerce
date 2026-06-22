import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoiceProviderFactory } from './invoice-provider.factory.js';
import { DirectSriInvoiceProvider } from './sri/sri-invoice.provider.js';
import { SriAccessKeyBuilder } from './sri/sri-access-key.builder.js';
import { SriXmlBuilder } from './sri/sri-xml.builder.js';
import { SriSignerService } from './sri/sri-signer.service.js';
import { SriSoapClient } from './sri/sri-soap.client.js';
import { InvoiceSequenceService } from './invoice-sequence.service.js';
import { SriCreditNoteXmlBuilder } from './sri/sri-credit-note-xml.builder.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
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
  ],
  exports: [InvoicesService, InvoiceProviderFactory, InvoiceSequenceService],
})
export class InvoicesModule {}
