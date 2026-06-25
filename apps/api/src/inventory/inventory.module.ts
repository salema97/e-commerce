import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { InventoryReservationService } from './inventory-reservation.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';

@Module({
  imports: [NotificationsModule, EventBusModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryReservationService],
  exports: [InventoryService, InventoryReservationService],
})
export class InventoryModule {}
