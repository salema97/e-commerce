import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { FaqService } from './faq.service.js';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto.js';

@ApiTags('AI Knowledge')
@Controller('ai/faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published FAQs' })
  findPublished() {
    return this.faqService.findPublished();
  }

  @Get('admin')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
  @ApiOperation({ summary: 'List all FAQs (admin)' })
  findAll() {
    return this.faqService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'faq', action: 'create' })
  create(@Body() dto: CreateFaqDto) {
    return this.faqService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'faq', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'faq', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.faqService.remove(id);
  }
}
