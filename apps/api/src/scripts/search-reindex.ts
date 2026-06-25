import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SearchReindexScriptModule } from '../ai/search/search-reindex-script.module.js';
import { SearchReindexService } from '../ai/search/search-reindex.service.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SearchReindexScriptModule, {
    logger: ['error', 'warn'],
  });

  try {
    const reindex = app.get(SearchReindexService);
    const result = await reindex.reindexAll();
    // eslint-disable-next-line no-console
    console.log(
      `Search reindex complete: ${result.indexed} products (meili=${result.meilisearchEnabled})`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
