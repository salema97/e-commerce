import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FulfillmentProvider } from './fulfillment-provider.interface.js';
import { ManualFulfillmentProvider } from './manual-fulfillment.provider.js';
import { FulfillmentService } from './fulfillment.service.js';
import { FulfillmentController } from './fulfillment.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [FulfillmentController],
  providers: [
    ManualFulfillmentProvider,
    { provide: FulfillmentProvider, useExisting: ManualFulfillmentProvider },
    FulfillmentService,
  ],
  exports: [FulfillmentService, FulfillmentProvider],
})
export class FulfillmentModule {}
