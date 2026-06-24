import { Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { DropshipService } from './dropship.service.js';

@ApiTags('Dropship')
@Controller('dropship')
export class DropshipController {
  constructor(private readonly dropshipService: DropshipService) {}

  @Post('orders/:orderId/split')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'Split dropship order items into supplier shipments' })
  split(@Param('orderId') orderId: string) {
    return this.dropshipService.splitOrderBySupplier(orderId);
  }
}
