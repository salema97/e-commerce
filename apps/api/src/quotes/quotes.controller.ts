import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuoteStatus } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { QuotesService } from './quotes.service.js';
import { CreateQuoteDto, UpdateQuoteStatusDto } from './dto/quote.dto.js';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Request a B2B quote' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my quote requests' })
  mine(@CurrentUser('userId') userId: string) {
    return this.quotesService.listMine(userId);
  }

  @Get('admin')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  adminList(@Query('status') status?: QuoteStatus) {
    return this.quotesService.listForAdmin(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by id' })
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'quote', action: 'update_status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto) {
    return this.quotesService.updateStatus(id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert approved quote to order' })
  convert(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.quotesService.convertToOrder(id, userId);
  }
}
