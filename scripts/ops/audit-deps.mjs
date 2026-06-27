#!/usr/bin/env node
/**
 * Local dependency audit wrapper. Runs pnpm audit and exits non-zero on high/critical.
 */
import { spawnSync } from 'node:child_process';

const result = spawnSync('pnpm', ['audit', '--audit-level=high'], {
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error('\n[audit:deps] High or critical vulnerabilities found.');
  process.exit(result.status ?? 1);
}

console.log('\n[audit:deps] No high/critical vulnerabilities reported.');
