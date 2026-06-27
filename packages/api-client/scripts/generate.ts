import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const generatedDir = join(rootDir, 'src', 'generated');
const specPath = join(generatedDir, 'openapi.json');
const checksumPath = join(generatedDir, '.openapi-checksum');

const DEFAULT_SPEC_URL = process.env.API_SPEC_URL ?? 'http://localhost:3001/v1/docs-json';
const FETCH_TIMEOUT_MS = Number(process.env.API_SPEC_TIMEOUT_MS ?? 10_000);

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function validateOpenApiSpec(spec: Record<string, unknown>): void {
  const version = spec.openapi ?? spec.swagger;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('Invalid OpenAPI document: missing openapi/swagger version field');
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Invalid OpenAPI document: missing paths object');
  }
}

async function fetchSpec(): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(DEFAULT_SPEC_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI spec from ${DEFAULT_SPEC_URL}: ${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timed out fetching OpenAPI spec from ${DEFAULT_SPEC_URL}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function readCommittedSpec(): { content: string; spec: Record<string, unknown> } {
  if (!existsSync(specPath)) {
    throw new Error(
      `Missing committed spec at ${specPath}. Run: pnpm api-client:generate`,
    );
  }

  const content = readFileSync(specPath, 'utf8');
  const spec = JSON.parse(content) as Record<string, unknown>;
  validateOpenApiSpec(spec);
  return { content, spec };
}

function specsMatch(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function writeCommittedSpec(spec: Record<string, unknown>): void {
  const content = JSON.stringify(spec, null, 2);
  writeFileSync(specPath, content);
  writeFileSync(checksumPath, `${hashContent(content)}\n`);
}

function generateClient(): void {
  execSync(
    `npx swagger-typescript-api generate -p "${specPath}" -o "${generatedDir}" -n api.ts --axios`,
    { stdio: 'inherit', cwd: rootDir },
  );
}

async function runGenerate(): Promise<void> {
  mkdirSync(generatedDir, { recursive: true });

  const spec = await fetchSpec();
  validateOpenApiSpec(spec);
  writeCommittedSpec(spec);
  generateClient();

  console.log('API client generated successfully from', DEFAULT_SPEC_URL);
}

async function runCheck(): Promise<void> {
  try {
    const fetched = await fetchSpec();
    validateOpenApiSpec(fetched);

    if (existsSync(specPath)) {
      const { spec: committed } = readCommittedSpec();
      if (!specsMatch(fetched, committed)) {
        throw new Error(
          'Fetched OpenAPI spec differs from src/generated/openapi.json. Run: pnpm api-client:generate',
        );
      }
      console.log('OpenAPI check passed (live fetch matches committed spec)');
      return;
    }

    console.log(
      'OpenAPI check passed (live fetch OK; no committed spec yet — run generate to pin)',
    );
    return;
  } catch (fetchError) {
    const message = fetchError instanceof Error ? fetchError.message : String(fetchError);

    if (!existsSync(specPath) || !existsSync(checksumPath)) {
      throw new Error(
        `${message}\nCannot fall back to checksum: missing openapi.json or .openapi-checksum. Start the API and run: pnpm api-client:generate`,
      );
    }

    const { content } = readCommittedSpec();
    const expected = readFileSync(checksumPath, 'utf8').trim();
    const actual = hashContent(content);
    if (actual !== expected) {
      throw new Error(
        'openapi.json checksum mismatch with .openapi-checksum. Run: pnpm api-client:generate',
      );
    }

    console.log(`OpenAPI check passed (offline checksum; API unreachable: ${message})`);
  }
}

const isCheck = process.argv.includes('--check');

async function main(): Promise<void> {
  if (isCheck) {
    await runCheck();
    return;
  }

  await runGenerate();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
