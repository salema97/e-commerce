import { Controller, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RefundService } from '../payments/refund.service.js';

@ApiTags('Refunds')
@ApiBearerAuth()
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundService: RefundService) {}

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Approve a pending refund (admin/finance)' })
  @ApiResponse({ status: 200, description: 'Refund approved' })
  @ApiResponse({ status: 400, description: 'Refund cannot be approved from current status' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  @HttpCode(HttpStatus.OK)
  approveRefund(
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.refundService.approveRefund(id, userId ?? 'system');
  }
}
