import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';
import { PosService } from './pos.service.js';
import {
  CreatePosOrderDto,
  CreatePosRegisterDto,
  CreateStoreLocationDto,
  UpdatePosRegisterDto,
  UpdateStoreLocationDto,
} from './dto/pos.dto.js';

@ApiTags('POS')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('locations')
  @Public()
  @ApiOperation({ summary: 'List active store locations (optionally pickup only)' })
  listLocations(@Query('pickup') pickup?: string) {
    return this.posService.listLocations(pickup === 'true');
  }

  @Post('locations')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'store_location', action: 'create' })
  createLocation(@Body() dto: CreateStoreLocationDto) {
    return this.posService.createLocation(dto);
  }

  @Patch('locations/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'store_location', action: 'update' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateStoreLocationDto) {
    return this.posService.updateLocation(id, dto);
  }

  @Get('registers')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  listRegisters(@Query('locationId') locationId?: string) {
    return this.posService.listRegisters(locationId);
  }

  @Post('registers')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'pos_register', action: 'create' })
  createRegister(@Body() dto: CreatePosRegisterDto) {
    return this.posService.createRegister(dto);
  }

  @Patch('registers/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'pos_register', action: 'update' })
  updateRegister(@Param('id') id: string, @Body() dto: UpdatePosRegisterDto) {
    return this.posService.updateRegister(id, dto);
  }

  @Post('registers/:id/close')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  closeRegister(@Param('id') id: string) {
    return this.posService.closeRegister(id);
  }

  @Post('orders')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'order', action: 'create_pos' })
  createPosOrder(@Body() dto: CreatePosOrderDto) {
    return this.posService.createPosOrder(dto);
  }

  @Post('orders/:id/complete-cash')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  completeCash(@Param('id') id: string) {
    return this.posService.completeCashPayment(id);
  }
}
