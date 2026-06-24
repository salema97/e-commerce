#!/usr/bin/env node
/**
 * Smoke load test — 10 concurrent health checks.
 * Usage: node scripts/load-test/smoke.mjs [baseUrl]
 */
const base = process.argv[2] ?? 'http://localhost:3001/v1';
const url = `${base.replace(/\/$/, '')}/health`;
const concurrency = 10;

async function hit() {
  const start = Date.now();
  const res = await fetch(url);
  const ms = Date.now() - start;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ms;
}

const results = await Promise.all(
  Array.from({ length: concurrency }, () => hit().catch((e) => ({ error: e.message }))),
);

const errors = results.filter((r) => r && typeof r === 'object' && 'error' in r);
const times = results.filter((r) => typeof r === 'number');
const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

console.log(JSON.stringify({ url, concurrency, ok: times.length, errors: errors.length, avgMs: avg }, null, 2));
if (errors.length > 0) process.exit(1);
