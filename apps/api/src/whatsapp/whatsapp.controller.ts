import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';

export interface QuickReply {
  id: string;
  label: string;
  text: string;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'greeting',
    label: 'Saludo',
    text: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?',
  },
  {
    id: 'order-status',
    label: 'Estado del pedido',
    text: 'Con gusto reviso el estado de tu pedido. ¿Podrías indicarnos el número de orden?',
  },
  {
    id: 'shipping',
    label: 'Envío',
    text: 'Tu pedido está en proceso de envío. En cuanto tengamos la guía de rastreo te la compartimos.',
  },
  {
    id: 'hours',
    label: 'Horario de atención',
    text: 'Nuestro horario de atención es de lunes a viernes de 08:00 a 18:00 y sábados de 09:00 a 13:00.',
  },
  {
    id: 'thanks',
    label: 'Agradecimiento',
    text: 'Gracias por tu compra. Si necesitas algo más, estamos para ayudarte.',
  },
];

@ApiTags('WhatsApp')
@Controller('whatsapp')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
export class WhatsAppController {
  @Get('quick-replies')
  @ApiOperation({ summary: 'List quick reply templates' })
  @ApiResponse({ status: 200, description: 'Quick reply templates' })
  getQuickReplies(): QuickReply[] {
    return DEFAULT_QUICK_REPLIES;
  }
}
