import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { FulfillmentProvider } from './fulfillment-provider.interface.js';
import { ManualFulfillmentProvider } from './manual-fulfillment.provider.js';
import { FulfillmentProviderFactory } from './fulfillment-provider.factory.js';
import { FulfillmentService } from './fulfillment.service.js';
import { FulfillmentController } from './fulfillment.controller.js';
import { LabelService } from './label.service.js';
import { WmsIntegrationService } from './wms-integration.service.js';
import { ServientregaFulfillmentService } from './servientrega/servientrega-fulfillment.service.js';
import { ServientregaTrackingSyncService } from './servientrega/servientrega-tracking-sync.service.js';

@Module({
  imports: [PrismaModule, forwardRef(() => ShippingModule)],
  controllers: [FulfillmentController],
  providers: [
    LabelService,
    ManualFulfillmentProvider,
    FulfillmentProviderFactory,
    { provide: FulfillmentProvider, useExisting: ManualFulfillmentProvider },
    ServientregaFulfillmentService,
    ServientregaTrackingSyncService,
    FulfillmentService,
    WmsIntegrationService,
  ],
  exports: [FulfillmentService, FulfillmentProvider, WmsIntegrationService],
})
export class FulfillmentModule {}
