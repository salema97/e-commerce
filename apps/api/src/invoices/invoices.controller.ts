import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service.js';
import { IssueInvoiceDto } from './dto/issue-invoice.dto.js';
import { InvoiceResponseDto } from './dto/invoice-response.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Issue an SRI invoice for a paid order' })
  @ApiResponse({ status: 201, description: 'Invoice issued', type: InvoiceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async issueInvoice(
    @Body() dto: IssueInvoiceDto,
    @CurrentUser('userId') clerkUserId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.issueInvoice(dto, clerkUserId);
  }
}
