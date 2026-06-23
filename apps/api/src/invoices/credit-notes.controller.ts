import {
  Controller,
  Get,
  Post,
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
import { CreditNoteStatus } from '@prisma/client';
import { InvoicesService, ListCreditNotesFilter } from './invoices.service.js';
import { CreditNoteResponseDto } from './dto/credit-note-response.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';

@ApiTags('Credit Notes')
@ApiBearerAuth()
@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'List SRI credit notes' })
  @ApiQuery({ name: 'returnRequestId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CreditNoteStatus })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiResponse({ status: 200, description: 'Credit notes listed', type: [CreditNoteResponseDto] })
  async list(
    @Query('returnRequestId') returnRequestId?: string,
    @Query('status') status?: CreditNoteStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<CreditNoteResponseDto[]> {
    const filter: ListCreditNotesFilter = {
      returnRequestId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };
    return this.invoicesService.listCreditNotes(filter);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Get credit note detail' })
  @ApiResponse({ status: 200, description: 'Credit note found', type: CreditNoteResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string): Promise<CreditNoteResponseDto> {
    return this.invoicesService.findCreditNoteById(id);
  }

  @Post(':id/retry')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Retry a failed or rejected credit note' })
  @ApiResponse({ status: 200, description: 'Retry enqueued', type: CreditNoteResponseDto })
  async retry(@Param('id') id: string): Promise<CreditNoteResponseDto> {
    return this.invoicesService.retryCreditNote(id);
  }

  @Get(':id/xml')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Download signed credit note XML via signed URL' })
  @ApiResponse({ status: 302, description: 'Redirect to signed URL' })
  async downloadXml(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.invoicesService.getCreditNoteSignedXmlUrl(id);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(':id/pdf')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Download credit note RIDE PDF via signed URL' })
  @ApiResponse({ status: 302, description: 'Redirect to signed URL' })
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.invoicesService.getCreditNoteSignedPdfUrl(id);
    res.redirect(HttpStatus.FOUND, url);
  }
}
