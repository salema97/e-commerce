import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConversationModule } from '../conversations/conversation.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';

@Module({
  imports: [PrismaModule, ConversationModule, WhatsAppModule, StorageModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
