-- Enable pgvector and add embedding column for knowledge similarity search
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embeddingVector" vector(1536);

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embeddingVector_idx"
  ON "KnowledgeChunk"
  USING hnsw ("embeddingVector" vector_cosine_ops);
