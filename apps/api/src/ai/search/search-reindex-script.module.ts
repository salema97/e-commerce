import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '../../config/env.validation.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MeilisearchService } from './meilisearch.service.js';
import { SearchReindexService } from './search-reindex.service.js';

/** CLI-only module; imported by search reindex scripts, not AppModule. */
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
