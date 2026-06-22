import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const generatedDir = join(rootDir, 'src', 'generated');
const specPath = join(generatedDir, 'openapi.json');

const DEFAULT_SPEC_URL = process.env.API_SPEC_URL ?? 'http://localhost:3001/v1/docs-json';

async function fetchSpec(): Promise<Record<string, unknown>> {
  const response = await fetch(DEFAULT_SPEC_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec from ${DEFAULT_SPEC_URL}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as Record<string, unknown>;
}

function generateClient() {
  execSync(
    `npx swagger-typescript-api -p ${specPath} -o ${generatedDir} -n api.ts --axios`,
    { stdio: 'inherit', cwd: rootDir },
  );
}

async function main() {
  mkdirSync(generatedDir, { recursive: true });

  const spec = await fetchSpec();
  writeFileSync(specPath, JSON.stringify(spec, null, 2));

  generateClient();

  console.log('API client generated successfully from', DEFAULT_SPEC_URL);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
