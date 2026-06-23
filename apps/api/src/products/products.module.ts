import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [NotificationsModule, AiModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
