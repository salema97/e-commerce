import { Body, Controller, Get, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationPreferencesController {
  constructor(private readonly preferencesService: NotificationPreferencesService) {}

  @Get('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification consent preferences for the current user' })
  getPreferences(@CurrentUser('userId') clerkUserId: string) {
    return this.preferencesService.getByClerkUserId(clerkUserId);
  }

  @Patch('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification consent preferences' })
  updatePreferences(
    @CurrentUser('userId') clerkUserId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.updateByClerkUserId(clerkUserId, dto);
  }

  @Get('unsubscribe')
  @Public()
  @ApiOperation({ summary: 'One-click unsubscribe from email links (GET)' })
  async unsubscribeGet(
    @Query('token') token: string,
    @Query('scope') scope: 'marketing' | 'transactional' = 'marketing',
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.processUnsubscribe(token, scope);
      res
        .status(200)
        .type('text/html; charset=utf-8')
        .send(unsubscribeSuccessHtml(scope));
    } catch {
      res.status(404).type('text/html; charset=utf-8').send(unsubscribeErrorHtml());
    }
  }

  @Post('unsubscribe')
  @Public()
  @ApiOperation({ summary: 'One-click unsubscribe using a signed token' })
  async unsubscribe(
    @Query('token') token: string,
    @Query('scope') scope: 'marketing' | 'transactional' = 'marketing',
  ): Promise<{ success: true }> {
    await this.processUnsubscribe(token, scope);
    return { success: true };
  }

  private async processUnsubscribe(
    token: string,
    scope: 'marketing' | 'transactional',
  ): Promise<void> {
    if (scope === 'transactional') {
      await this.preferencesService.unsubscribeTransactionalByToken(token);
    } else {
      await this.preferencesService.unsubscribeMarketingByToken(token);
    }
  }
}

function unsubscribeSuccessHtml(scope: 'marketing' | 'transactional'): string {
  const message =
    scope === 'transactional'
      ? 'Ya no recibirás correos transaccionales de pedidos.'
      : 'Ya no recibirás correos de marketing y promociones.';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Preferencias actualizadas</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;">
  <h1>Preferencias actualizadas</h1>
  <p>${message}</p>
  <p>Puedes volver a activarlas desde tu cuenta en cualquier momento.</p>
</body>
</html>`;
}

function unsubscribeErrorHtml(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Enlace no válido</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;">
  <h1>Enlace no válido</h1>
  <p>Este enlace de cancelación de suscripción no es válido o ya expiró.</p>
</body>
</html>`;
}
