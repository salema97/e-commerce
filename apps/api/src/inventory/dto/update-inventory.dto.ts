import { PartialType } from '@nestjs/swagger';
import { CreateInventoryDto } from './create-inventory.dto.js';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {}
