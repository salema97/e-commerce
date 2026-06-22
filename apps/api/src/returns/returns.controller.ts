import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ReturnsService } from './returns.service.js';
import { StoreCreditService } from './store-credit.service.js';
import { CreateReturnDto } from './dto/create-return.dto.js';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto.js';
import { ReturnStatus } from '@prisma/client';

/**
 * Handles the customer-facing route nested under /orders/:id/returns. Kept as a
 * dedicated controller so it can live under the `orders` route prefix without
 * polluting the main /returns admin controller.
 */
@ApiTags('Returns')
@ApiBearerAuth()
@Controller('orders')
export class OrderReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post(':id/returns')
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a return request for an order (customer)' })
  @ApiResponse({ status: 201, description: 'Return request created' })
  @ApiResponse({ status: 400, description: 'Invalid input or order not returnable' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  createReturnForOrder(
    @Param('id') id: string,
    @Body() dto: CreateReturnDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.returnsService.createReturnRequest({ ...dto, orderId: id, userId });
  }
}

@ApiTags('Returns')
@ApiBearerAuth()
@Controller('returns')
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
    private readonly storeCreditService: StoreCreditService,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiOperation({ summary: 'List return requests (admin)' })
  @ApiResponse({ status: 200, description: 'Returns list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'status', required: false, enum: ReturnStatus })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  listReturns(
    @Query('status') status?: ReturnStatus,
    @Query('orderId') orderId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.returnsService.listReturns({
      status,
      orderId,
      userId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('store-credit/me')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get the current customer store-credit balance' })
  @ApiResponse({ status: 200, description: 'Store credit balance' })
  myStoreCredit(@CurrentUser('userId') userId?: string) {
    return this.storeCreditService.balance(userId ?? '');
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.SUPPORT, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get a return request by id (admin or owner)' })
  @ApiResponse({ status: 200, description: 'Return found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  async getReturn(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string; role: Role },
  ) {
    const record = await this.returnsService.getReturn(id);
    if (user && user.role === Role.CUSTOMER) {
      if (!record.userId || record.userId !== user.userId) {
        throw new ForbiddenException('Cannot access another customer return');
      }
    }
    return record;
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update return request status (admin)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Return not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.returnsService.updateStatus(id, dto, userId ?? 'system');
  }
}
