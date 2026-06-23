import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { CatalogService } from './catalog.service.js';
import { CatalogQueryDto } from './dto/catalog-query.dto.js';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse catalog with filters, facets, and pagination' })
  browse(@Query() query: CatalogQueryDto) {
    return this.catalogService.browse(query);
  }
}
