import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { SearchReindexService } from './search-reindex.service.js';

@ApiTags('Search Admin')
@Controller('search/admin')
export class SearchAdminController {
  constructor(private readonly reindexService: SearchReindexService) {}

  @Post('reindex')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'search_index', action: 'reindex' })
  @ApiOperation({ summary: 'Rebuild Meilisearch product index from Prisma' })
  reindex() {
    return this.reindexService.reindexAll();
  }
}
