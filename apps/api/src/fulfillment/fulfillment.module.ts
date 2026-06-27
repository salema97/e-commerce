import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FulfillmentProvider } from './fulfillment-provider.interface.js';
import { ManualFulfillmentProvider } from './manual-fulfillment.provider.js';
import { FulfillmentProviderFactory } from './fulfillment-provider.factory.js';
import { FulfillmentService } from './fulfillment.service.js';
import { FulfillmentController } from './fulfillment.controller.js';
import { LabelService } from './label.service.js';
import { WmsIntegrationService } from './wms-integration.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [FulfillmentController],
  providers: [
    LabelService,
    ManualFulfillmentProvider,
    FulfillmentProviderFactory,
    { provide: FulfillmentProvider, useExisting: ManualFulfillmentProvider },
    FulfillmentService,
    WmsIntegrationService,
  ],
  exports: [FulfillmentService, WmsIntegrationService],
})
export class FulfillmentModule {}
