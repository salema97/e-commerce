import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { ProductContentAiService } from './product-content-ai.service.js';

@ApiTags('AI Product Content')
@Controller('ai/products')
export class ProductContentAiController {
  constructor(private readonly productContentAi: ProductContentAiService) {}

  @Post(':id/generate-content')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'product', action: 'generate_ai_content' })
  @ApiOperation({ summary: 'Generate AI product content draft' })
  generate(@Param('id') id: string) {
    return this.productContentAi.generateDraft(id);
  }

  @Get(':id/content-draft')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  getDraft(@Param('id') id: string) {
    return this.productContentAi.getDraft(id);
  }

  @Post(':id/content-draft/approve')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'product', action: 'approve_ai_content' })
  approve(@Param('id') id: string) {
    return this.productContentAi.approveDraft(id);
  }

  @Post(':id/content-draft/reject')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'product', action: 'reject_ai_content' })
  reject(@Param('id') id: string) {
    return this.productContentAi.rejectDraft(id);
  }
}
