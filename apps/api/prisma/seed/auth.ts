import * as argon2 from 'argon2';
import { ARGON2_HASH_OPTIONS } from '../../src/auth/argon2-options.js';

const DEFAULT_SEED_PASSWORD = 'SeedDemo123!';

export async function hashSeedPassword(password?: string): Promise<string> {
  const plain = password ?? process.env.SEED_USER_PASSWORD ?? DEFAULT_SEED_PASSWORD;
  return argon2.hash(plain, ARGON2_HASH_OPTIONS);
}

export function logSeedCredentials(): void {
  const password = process.env.SEED_USER_PASSWORD ?? DEFAULT_SEED_PASSWORD;
  // eslint-disable-next-line no-console
  console.log('\n--- Seed accounts (dev only) ---');
  // eslint-disable-next-line no-console
  console.log(`Password for all seed users: ${password}\n`);
  const accounts = [
    ['SUPER_ADMIN', 'superadmin@example.com'],
    ['ADMIN', 'store-admin@example.com'],
    ['FINANCE', 'finance@example.com'],
    ['INVENTORY', 'inventory@example.com'],
    ['SUPPORT', 'support@example.com'],
    ['CUSTOMER', 'cliente@example.com'],
  ] as const;
  for (const [role, email] of accounts) {
    // eslint-disable-next-line no-console
    console.log(`  ${role.padEnd(12)} ${email}`);
  }
  // eslint-disable-next-line no-console
  console.log('--------------------------------\n');
}
