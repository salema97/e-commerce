import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ManualFulfillmentProvider } from '../manual-fulfillment.provider.js';
import type { ShipmentLineInput } from '../fulfillment-provider.interface.js';
import { ServientregaCityService } from '../../shipping/servientrega/servientrega-city.service.js';
import { ServientregaQuoteClient } from '../../shipping/servientrega/servientrega-quote.client.js';
import { ServientregaGuideSoapClient } from '../../shipping/servientrega/servientrega-guide-soap.client.js';
import { buildServientregaEnvioExterno } from '../../shipping/servientrega/servientrega-guide.builder.js';
import { buildServientregaTrackingUrl } from '../../shipping/servientrega/servientrega-order.util.js';
import { ServientregaSriRemissionService } from './servientrega-sri-remission.service.js';

@Injectable()
export class ServientregaFulfillmentService {
  private readonly logger = new Logger(ServientregaFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly quoteClient: ServientregaQuoteClient,
    private readonly cityService: ServientregaCityService,
    private readonly guideClient: ServientregaGuideSoapClient,
    private readonly manualFulfillment: ManualFulfillmentProvider,
    private readonly sriRemission: ServientregaSriRemissionService,
  ) {}

  async createShipmentFromOrder(orderId: string, items?: ShipmentLineInput[]) {
    if (!this.guideClient.isConfigured()) {
      throw new BadRequestException(
        'Servientrega SOAP is not configured. Set SERVIENTREGA_LOGIN, SERVIENTREGA_PASSWORD, SERVIENTREGA_BILLING_CODE, and SERVIENTREGA_LOAD_NAME.',
      );
    }

    if (!this.quoteClient.isConfigured()) {
      throw new BadRequestException(
        'Servientrega quote configuration is required. Set SERVIENTREGA_COUNTRY_ID, SERVIENTREGA_ORIGIN_CITY_ID, and SERVIENTREGA_PRODUCT_ID.',
      );
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existing = await this.prisma.shipment.findFirst({
      where: {
        orderId,
        carrier: { contains: 'servientrega', mode: 'insensitive' },
        status: { in: ['PENDING', 'LABEL_CREATED', 'IN_TRANSIT'] },
      },
    });
    if (existing && !items?.length) {
      throw new ConflictException(
        `Order ${order.orderNumber} already has an active Servientrega shipment (${existing.trackingNumber ?? existing.id})`,
      );
    }

    const shippingAddress = order.shippingAddress as Record<string, string> | null;
    const destinationCityId = await this.cityService.resolveDestinationCityId(
      shippingAddress?.city,
      shippingAddress?.state,
    );
    if (!destinationCityId) {
      throw new BadRequestException(
        'Could not map destination city to Servientrega. Sync cities or verify the shipping address.',
      );
    }

    const envio = buildServientregaEnvioExterno({
      order,
      destinationCityId,
      originCityId: this.quoteClient.getOriginCityId()!,
      originContactName: this.config.get<string>('SERVIENTREGA_ORIGIN_CONTACT_NAME') ?? 'Warehouse',
      originStreet: this.config.get<string>('SERVIENTREGA_ORIGIN_STREET') ?? 'N/A',
      originCityName: this.config.get<string>('SERVIENTREGA_ORIGIN_CITY_NAME') ?? 'Quito',
      originProvince: this.config.get<string>('SERVIENTREGA_ORIGIN_PROVINCE') ?? undefined,
      originPhone: this.config.get<string>('SERVIENTREGA_ORIGIN_PHONE') ?? undefined,
    });

    const guide = await this.guideClient.createGuide(envio);
    const guideNumber = guide.guideNumbers[0]!;
    const trackingUrl = buildServientregaTrackingUrl(
      guideNumber,
      this.config.get<string>('SERVIENTREGA_TRACKING_PUBLIC_URL'),
    );

    const shipment = await this.manualFulfillment.createShipment({
      orderId,
      carrier: 'Servientrega',
      trackingNumber: guideNumber,
      trackingUrl,
      externalId: order.orderNumber,
      shippingCost: Number(order.shippingAmount),
      items,
    });

    this.logger.log({ orderId, guideNumber }, 'Servientrega guide created');

    const sriRemission = await this.sriRemission.tryIssueForShipment({
      orderId,
      shipmentId: shipment.id,
      guideNumber,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.subtotal),
    });

    return {
      ...shipment,
      servientregaGuideNumber: guideNumber,
      servientregaRaw: guide.raw,
      sriRemission,
    };
  }
}
