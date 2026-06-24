import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { ConfigService } from '@nestjs/config';
import { MeilisearchService } from '../ai/search/meilisearch.service.js';
import { SearchReindexService } from '../ai/search/search-reindex.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prismaClient = new PrismaClient({ adapter: new PrismaPg(pool) });
  const config = new ConfigService();
  const meilisearch = new MeilisearchService(config);
  await meilisearch.onModuleInit();

  const prisma = prismaClient as unknown as PrismaService;
  const reindex = new SearchReindexService(prisma, meilisearch);
  const result = await reindex.reindexAll();
  // eslint-disable-next-line no-console
  console.log(`Search reindex complete: ${result.indexed} products (meili=${result.meilisearchEnabled})`);
  await prismaClient.$disconnect();
  await pool.end();
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
