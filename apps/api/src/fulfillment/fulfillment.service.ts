import { Inject, Injectable } from '@nestjs/common';
import { FulfillmentProvider } from './fulfillment-provider.interface.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';

@Injectable()
export class FulfillmentService {
  constructor(
    @Inject(FulfillmentProvider) private readonly provider: FulfillmentProvider,
  ) {}

  createShipment(orderId: string, dto: CreateShipmentDto) {
    return this.provider.createShipment({
      orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      shippingCost: dto.shippingCost,
    });
  }

  markDelivered(shipmentId: string) {
    return this.provider.markDelivered(shipmentId);
  }

  listShipments(orderId: string) {
    return this.provider.listShipments(orderId);
  }
}
