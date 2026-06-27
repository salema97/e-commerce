import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SriSupplementaryService } from '../../invoices/sri/sri-supplementary.service.js';

export interface ServientregaSriRemissionResult {
  skipped?: boolean;
  issued?: boolean;
  error?: string;
  id?: string;
  documentType?: string;
  accessKey?: string;
  status?: string;
  authorizationNumber?: string;
}

@Injectable()
export class ServientregaSriRemissionService {
  private readonly logger = new Logger(ServientregaSriRemissionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supplementaryService: SriSupplementaryService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('SERVIENTREGA_SRI_REMISSION_ENABLED') === 'true';
  }

  async tryIssueForShipment(input: {
    orderId: string;
    shipmentId: string;
    guideNumber: string;
    orderNumber: string;
    totalAmount?: number;
  }): Promise<ServientregaSriRemissionResult> {
    if (!this.isEnabled()) {
      return { skipped: true };
    }

    try {
      const result = await this.supplementaryService.issue({
        documentType: '06',
        orderId: input.orderId,
        shipmentId: input.shipmentId,
        carrierGuideNumber: input.guideNumber,
        totalAmount: input.totalAmount,
        reason: `Traslado de mercadería — pedido ${input.orderNumber} — guía Servientrega ${input.guideNumber}`,
      });

      return { issued: true, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SRI guía 06 failed';
      this.logger.error(
        { orderId: input.orderId, shipmentId: input.shipmentId, error: message },
        'Servientrega SRI remission guide failed (shipment kept)',
      );
      return { issued: false, error: message };
    }
  }
}
