import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { WmsIntegrationService } from '../fulfillment/wms-integration.service.js';
import { WmsImportTrackingDto, WmsSyncInventoryDto } from '../fulfillment/public-api.js';

@ApiTags('Webhooks')
@Controller('webhooks/wms')
@Public()
export class WmsWebhookController {
  constructor(
    private readonly wmsIntegration: WmsIntegrationService,
    private readonly config: ConfigService,
  ) {}

  @Post(':provider/inventory')
  @HttpCode(200)
  @ApiOperation({ summary: 'WMS inventory sync webhook' })
  @ApiResponse({ status: 200 })
  async inventoryWebhook(
    @Param('provider') provider: string,
    @Headers('x-wms-signature') signature: string | undefined,
    @Body() dto: WmsSyncInventoryDto,
  ) {
    this.verifySignature(signature);
    const result = await this.wmsIntegration.syncInventory(dto.records);
    return { provider, ...result };
  }

  @Post(':provider/tracking')
  @HttpCode(200)
  @ApiOperation({ summary: 'WMS tracking events webhook' })
  @ApiResponse({ status: 200 })
  async trackingWebhook(
    @Param('provider') provider: string,
    @Headers('x-wms-signature') signature: string | undefined,
    @Body() dto: WmsImportTrackingDto,
  ) {
    this.verifySignature(signature);
    const imported = await this.wmsIntegration.importTracking(dto.events);
    return { provider, imported };
  }

  private verifySignature(signature: string | undefined) {
    const secret = this.config.get<string>('WMS_WEBHOOK_SECRET');
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    if (!secret) {
      if (isProduction) {
        throw new UnauthorizedException('WMS webhook secret is not configured');
      }
      return;
    }
    if (!signature || signature !== secret) {
      throw new UnauthorizedException('Invalid WMS webhook signature');
    }
  }
}
