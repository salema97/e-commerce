import { PartialType } from '@nestjs/swagger';
import { CreateWhatsAppQuickReplyDto } from './create-whatsapp-quick-reply.dto.js';

export class UpdateWhatsAppQuickReplyDto extends PartialType(CreateWhatsAppQuickReplyDto) {}
