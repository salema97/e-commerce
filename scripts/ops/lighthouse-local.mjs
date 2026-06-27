#!/usr/bin/env node
/**
 * Local Lighthouse runner (requires Chrome + optional @lhci/cli).
 * Usage: WEB_URL=http://localhost:3000 pnpm audit:lighthouse
 */
import { spawnSync } from 'node:child_process';

const url = process.env.WEB_URL ?? 'http://localhost:3000';
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

console.log(`[audit:lighthouse] Target: ${url}`);

const npxResult = spawnSync(
  'npx',
  [
    'lighthouse',
    url,
    '--quiet',
    '--chrome-flags=--headless',
    `--only-categories=${categories.join(',')}`,
    '--output=json',
    '--output-path=./.lighthouse/report.json',
  ],
  { stdio: 'inherit', shell: true },
);

if (npxResult.status !== 0) {
  console.error(
    '\n[audit:lighthouse] Failed. Install Chrome and run: npx lighthouse --version',
  );
  process.exit(npxResult.status ?? 1);
}

console.log('\n[audit:lighthouse] Report written to .lighthouse/report.json');
