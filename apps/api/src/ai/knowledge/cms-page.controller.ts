import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { CmsPageService } from './cms-page.service.js';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto/cms-page.dto.js';

@ApiTags('AI Knowledge')
@Controller('ai/cms-pages')
export class CmsPageController {
  constructor(private readonly cmsPageService: CmsPageService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published CMS page by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.cmsPageService.findPublishedBySlug(slug);
  }

  @Get('admin/list')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List CMS pages (admin)' })
  findAll() {
    return this.cmsPageService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'cms_page', action: 'create' })
  create(@Body() dto: CreateCmsPageDto) {
    return this.cmsPageService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'cms_page', action: 'update' })
  update(@Param('id') id: string, @Body() dto: UpdateCmsPageDto) {
    return this.cmsPageService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'cms_page', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.cmsPageService.remove(id);
  }
}
