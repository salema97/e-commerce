import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService, ListInvoicesFilter } from './invoices.service.js';
import { IssueInvoiceDto } from './dto/issue-invoice.dto.js';
import { IssueCreditNoteDto } from './dto/issue-credit-note.dto.js';
import { InvoiceResponseDto } from './dto/invoice-response.dto.js';
import { CreditNoteResponseDto } from './dto/credit-note-response.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'List SRI invoices' })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Invoices listed', type: [InvoiceResponseDto] })
  async list(
    @Query('orderId') orderId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<InvoiceResponseDto[]> {
    const filter: ListInvoicesFilter = {
      orderId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };
    return this.invoicesService.list(filter);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get invoice detail' })
  @ApiResponse({ status: 200, description: 'Invoice found', type: InvoiceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.findById(id);
    this.invoicesService.assertInvoiceAccess(invoice, {
      userId: user.userId,
      role: user.role,
    });
    return invoice;
  }

  @Post(':id/retry')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'invoice', action: 'retry' })
  @ApiOperation({ summary: 'Retry a failed or rejected invoice' })
  @ApiResponse({ status: 200, description: 'Retry enqueued', type: InvoiceResponseDto })
  async retry(@Param('id') id: string): Promise<InvoiceResponseDto> {
    return this.invoicesService.retryIssue(id);
  }

  @Get(':id/xml')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.CUSTOMER)
  @ApiOperation({ summary: 'Download signed invoice XML via signed URL' })
  @ApiResponse({ status: 302, description: 'Redirect to signed URL' })
  async downloadXml(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
    @Res() res: Response,
  ): Promise<void> {
    const invoice = await this.invoicesService.findById(id);
    this.invoicesService.assertInvoiceAccess(invoice, {
      userId: user.userId,
      role: user.role,
    });
    const url = await this.invoicesService.getSignedXmlUrl(id);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(':id/pdf')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.CUSTOMER)
  @ApiOperation({ summary: 'Download invoice RIDE PDF via signed URL' })
  @ApiResponse({ status: 302, description: 'Redirect to signed URL' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
    @Res() res: Response,
  ): Promise<void> {
    const invoice = await this.invoicesService.findById(id);
    this.invoicesService.assertInvoiceAccess(invoice, {
      userId: user.userId,
      role: user.role,
    });
    const url = await this.invoicesService.getSignedPdfUrl(id);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'invoice', action: 'issue' })
  @ApiOperation({ summary: 'Issue an SRI invoice for a paid order' })
  @ApiResponse({ status: 201, description: 'Invoice issued', type: InvoiceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async issueInvoice(
    @Body() dto: IssueInvoiceDto,
    @CurrentUser('userId') userId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.issueInvoice(dto, userId);
  }

  @Post('credit-notes')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'credit_note', action: 'issue' })
  @ApiOperation({ summary: 'Issue an SRI credit note (04) for a return request' })
  @ApiResponse({ status: 201, description: 'Credit note issued', type: CreditNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or no original invoice' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async issueCreditNote(
    @Body() dto: IssueCreditNoteDto,
    @CurrentUser('userId') userId: string,
  ): Promise<CreditNoteResponseDto> {
    return this.invoicesService.issueCreditNote(dto, userId);
  }
}
