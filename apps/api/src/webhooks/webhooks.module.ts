import { Module, forwardRef } from '@nestjs/common';
import { RedisModule } from '../common/redis/redis.module.js';
import { ConversationModule } from '../conversations/conversation.module.js';
import { MessageModule } from '../messages/message.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { AiModule } from '../ai/ai.module.js';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';

@Module({
  imports: [
    RedisModule,
    ConversationModule,
    MessageModule,
    WhatsAppModule,
    forwardRef(() => AiModule),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhooksModule {}
