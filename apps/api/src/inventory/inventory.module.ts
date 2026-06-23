import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { InventoryReservationService } from './inventory-reservation.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryReservationService],
  exports: [InventoryService, InventoryReservationService],
})
export class InventoryModule {}
