import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceGiftCardsService } from './finance-gift-cards.service.js';
import { AdminGiftCardDto } from './dto/admin-gift-card.dto.js';
import { CreateGiftCardDto, UpdateGiftCardDto } from './dto/create-gift-card.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { FINANCE_ROLES } from '../finance.constants.js';

@ApiTags('Finance — Gift Cards')
@ApiBearerAuth()
@Controller('finance/gift-cards')
export class FinanceGiftCardsController {
  constructor(private readonly giftCardsService: FinanceGiftCardsService) {}

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'List gift cards' })
  findAll(): Promise<AdminGiftCardDto[]> {
    return this.giftCardsService.findAll();
  }

  @Post()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Create a gift card' })
  create(
    @Body() dto: CreateGiftCardDto,
    @CurrentUser('userId') actorId: string,
  ): Promise<AdminGiftCardDto> {
    return this.giftCardsService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Update gift card balance or status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGiftCardDto,
    @CurrentUser('userId') actorId: string,
  ): Promise<AdminGiftCardDto> {
    return this.giftCardsService.update(id, dto, actorId);
  }
}
