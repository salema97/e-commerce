import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { InventoryReservationService } from './inventory-reservation.service.js';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryReservationService],
  exports: [InventoryService, InventoryReservationService],
})
export class InventoryModule {}
