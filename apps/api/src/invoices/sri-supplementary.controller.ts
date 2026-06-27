import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { SriSupplementaryService } from './sri/sri-supplementary.service.js';
import { IssueSupplementaryDocumentDto } from './invoices.api.js';

@ApiTags('Invoices — SRI Supplementary')
@ApiBearerAuth()
@Controller('invoices/sri/supplementary')
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
export class SriSupplementaryController {
  constructor(private readonly supplementaryService: SriSupplementaryService) {}

  @Get()
  @ApiOperation({ summary: 'List SRI supplementary documents (05/06/07)' })
  findAll(@Query('documentType') documentType?: string) {
    return this.supplementaryService.findAll(documentType);
  }

  @Post()
  @ApiOperation({ summary: 'Issue SRI supplementary document 05/06/07' })
  issue(@Body() dto: IssueSupplementaryDocumentDto) {
    return this.supplementaryService.issue(dto);
  }
}
