import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator.js';
import { HybridSearchService } from './hybrid-search.service.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: HybridSearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Hybrid product search (keyword + optional semantic)' })
  search(@Query('q') query: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.searchService.search(query ?? '', Number.isFinite(parsedLimit) ? parsedLimit : 20);
  }
}
