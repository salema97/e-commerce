import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceStoreCreditsService } from './finance-store-credits.service.js';
import { AdminStoreCreditDto } from './dto/admin-store-credit.dto.js';
import { IssueStoreCreditDto, UpdateStoreCreditDto } from './dto/issue-store-credit.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { FINANCE_ROLES } from '../finance.constants.js';

@ApiTags('Finance — Store Credits')
@ApiBearerAuth()
@Controller('finance/store-credits')
export class FinanceStoreCreditsController {
  constructor(private readonly storeCreditsService: FinanceStoreCreditsService) {}

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'List store credit balances' })
  findAll(): Promise<AdminStoreCreditDto[]> {
    return this.storeCreditsService.findAll();
  }

  @Post()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Issue store credit to a user' })
  issue(
    @Body() dto: IssueStoreCreditDto,
    @CurrentUser('userId') actorId: string,
  ): Promise<AdminStoreCreditDto> {
    return this.storeCreditsService.issue(dto, actorId);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Adjust store credit balance or expiry' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreCreditDto,
    @CurrentUser('userId') actorId: string,
  ): Promise<AdminStoreCreditDto> {
    return this.storeCreditsService.update(id, dto, actorId);
  }
}
