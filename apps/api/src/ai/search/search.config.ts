import { ConfigService } from '@nestjs/config';

export function isSemanticSearchEnabled(
  config: ConfigService,
  meilisearchEnabled: boolean,
): boolean {
  const flag = config.get<string>('SEMANTIC_SEARCH_ENABLED', 'auto');

  if (flag === 'true') {
    return true;
  }

  if (flag === 'false') {
    return false;
  }

  return meilisearchEnabled;
}
