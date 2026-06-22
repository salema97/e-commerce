import { Module } from '@nestjs/common';
import { WhatsAppModule } from './whatsapp.module.js';
import { ConversationModule } from '../conversations/conversation.module.js';
import { MessageModule } from '../messages/message.module.js';
import { WhatsAppNotificationService } from './whatsapp-notification.service.js';

/**
 * Transactional WhatsApp notifications module.
 *
 * Depends on the WhatsApp provider port, conversation persistence, and the
 * message service, but is kept separate from the inbound webhook flow to avoid
 * a circular module dependency.
 */
@Module({
  imports: [WhatsAppModule, ConversationModule, MessageModule],
  providers: [WhatsAppNotificationService],
  exports: [WhatsAppNotificationService],
})
export class WhatsAppNotificationModule {}
