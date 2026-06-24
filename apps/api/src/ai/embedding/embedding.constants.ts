/** OpenAI text-embedding-3-small dimension; console provider pads to match. */
export const EMBEDDING_DIMENSIONS = 1536;

export function formatPgVector(values: number[]): string {
  return `[${values.join(',')}]`;
}
