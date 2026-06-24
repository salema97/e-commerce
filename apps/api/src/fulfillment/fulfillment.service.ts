import { Inject, Injectable } from '@nestjs/common';
import { FulfillmentProviderFactory } from './fulfillment-provider.factory.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { LabelService } from './label.service.js';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly providerFactory: FulfillmentProviderFactory,
    private readonly labelService: LabelService,
  ) {}

  createShipment(orderId: string, dto: CreateShipmentDto) {
    return this.providerFactory.resolve().createShipment({
      orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      shippingCost: dto.shippingCost,
      items: dto.items,
    });
  }

  markDelivered(shipmentId: string) {
    return this.providerFactory.resolve().markDelivered(shipmentId);
  }

  listShipments(orderId: string) {
    return this.providerFactory.resolve().listShipments(orderId);
  }

  getLabelHtml(shipmentId: string) {
    return this.labelService.renderLabelHtml(shipmentId);
  }
}
