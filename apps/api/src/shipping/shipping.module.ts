import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ShippingController } from './shipping.controller.js';
import { ShippingService } from './shipping.service.js';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { ShippoCarrierRateProvider } from './shippo-carrier-rate.provider.js';
import { EasyPostCarrierRateProvider } from './easypost-carrier-rate.provider.js';
import { ShipEngineCarrierRateProvider } from './shipengine-carrier-rate.provider.js';
import { CarrierRateProviderFactory } from './carrier-rate-provider.factory.js';
import { ServientregaQuoteClient } from './servientrega/servientrega-quote.client.js';
import { ServientregaCityService } from './servientrega/servientrega-city.service.js';
import { ServientregaCitySyncService } from './servientrega/servientrega-city-sync.service.js';
import { ServientregaCarrierRateProvider } from './servientrega/servientrega-carrier-rate.provider.js';
import { ServientregaGuideSoapClient } from './servientrega/servientrega-guide-soap.client.js';
import { ServientregaTrackingSoapClient } from './servientrega/servientrega-tracking-soap.client.js';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingController],
  providers: [
    ZoneFlatRateProvider,
    ShippoCarrierRateProvider,
    EasyPostCarrierRateProvider,
    ShipEngineCarrierRateProvider,
    ServientregaQuoteClient,
    ServientregaCityService,
    ServientregaCitySyncService,
    ServientregaCarrierRateProvider,
    ServientregaGuideSoapClient,
    ServientregaTrackingSoapClient,
    CarrierRateProviderFactory,
    ShippingService,
  ],
  exports: [
    ShippingService,
    CarrierRateProviderFactory,
    ServientregaCityService,
    ServientregaQuoteClient,
    ServientregaGuideSoapClient,
    ServientregaTrackingSoapClient,
  ],
})
export class ShippingModule {}
