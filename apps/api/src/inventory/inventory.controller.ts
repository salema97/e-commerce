import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { UpdateInventoryDto } from './dto/update-inventory.dto.js';
import { ReserveInventoryDto } from './dto/reserve-inventory.dto.js';
import { Audit } from '../audit/audit.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Create an inventory record' })
  @ApiResponse({ status: 201, description: 'Inventory record created' })
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inventory records' })
  @ApiResponse({ status: 200, description: 'Inventory records returned' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory record by id' })
  @ApiResponse({ status: 200, description: 'Inventory record found' })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'inventory', action: 'update' })
  @ApiOperation({ summary: 'Update an inventory record' })
  @ApiResponse({ status: 200, description: 'Inventory record updated' })
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'inventory', action: 'delete' })
  @ApiOperation({ summary: 'Delete an inventory record' })
  @ApiResponse({ status: 200, description: 'Inventory record deleted' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Post(':id/reserve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'inventory', action: 'reserve' })
  @ApiOperation({ summary: 'Reserve stock units' })
  @ApiResponse({ status: 200, description: 'Stock reserved' })
  @ApiResponse({ status: 400, description: 'Insufficient available stock' })
  reserve(
    @Param('id') id: string,
    @Body() reserveInventoryDto: ReserveInventoryDto,
  ) {
    return this.inventoryService.reserve(id, reserveInventoryDto.quantity);
  }

  @Post(':id/release')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'inventory', action: 'release' })
  @ApiOperation({ summary: 'Release reserved stock units' })
  @ApiResponse({ status: 200, description: 'Stock released' })
  release(
    @Param('id') id: string,
    @Body() reserveInventoryDto: ReserveInventoryDto,
  ) {
    return this.inventoryService.release(id, reserveInventoryDto.quantity);
  }
}
