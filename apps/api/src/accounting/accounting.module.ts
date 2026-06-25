import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AccountingController } from './accounting.controller.js';
import { AccountingService } from './accounting.service.js';
import { AccountingProviderFactory } from './accounting.factory.js';
import { ConsoleAccountingProvider } from './console-accounting.provider.js';
import { SiigoAccountingProvider } from './siigo-accounting.provider.js';
import { InvoiceAuthorizedAccountingConsumer } from './invoice-authorized-accounting.consumer.js';

@Module({
  imports: [ConfigModule, PrismaModule, EventBusModule],
  controllers: [AccountingController],
  providers: [
    AccountingService,
    AccountingProviderFactory,
    ConsoleAccountingProvider,
    SiigoAccountingProvider,
    InvoiceAuthorizedAccountingConsumer,
  ],
  exports: [AccountingService],
})
export class AccountingModule {}
