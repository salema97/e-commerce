#!/usr/bin/env node
/**
 * Ecuador pre-launch gate: dependency audit + Playwright smoke specs.
 * SRI production credentials must be configured manually — see docs/ops/sri-production-checklist.md
 */
import { spawnSync } from 'node:child_process';

function run(command, args, label) {
  console.log(`\n[prelaunch:ec] ${label}…`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`[prelaunch:ec] Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('[prelaunch:ec] Ecuador pre-launch checks');
console.log('[prelaunch:ec] SRI prod: configure .env per docs/ops/sri-production-checklist.md\n');

run('pnpm', ['audit:deps'], 'Dependency audit (high/critical)');
run('pnpm', ['--filter', '@repo/web', 'exec', 'playwright', 'test', 'e2e/smoke.spec.ts'], 'Playwright smoke (web)');

console.log('\n[prelaunch:ec] All automated checks passed.');
console.log('[prelaunch:ec] Manual: complete SRI production checklist before go-live.');
