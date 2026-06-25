import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '../../config/env.validation.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MeilisearchService } from './meilisearch.service.js';
import { SearchReindexService } from './search-reindex.service.js';

/** Minimal module for CLI reindex — avoids bootstrapping the full AppModule graph. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    PrismaModule,
  ],
  providers: [MeilisearchService, SearchReindexService],
})
export class SearchReindexScriptModule {}
