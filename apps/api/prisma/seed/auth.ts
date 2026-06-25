import * as argon2 from 'argon2';
import { ARGON2_HASH_OPTIONS } from '../../src/auth/argon2-options.js';

export function getSeedPassword(): string {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error(
      'SEED_USER_PASSWORD is required to run prisma seed. Set it in apps/api/.env (see .env.example).',
    );
  }
  return password;
}

export function hashSeedPassword(password?: string): Promise<string> {
  const plain = password ?? getSeedPassword();
  return argon2.hash(plain, ARGON2_HASH_OPTIONS);
}

export function logSeedCredentials(): void {
  const password = getSeedPassword();
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
    ['CUSTOMER', 'amiga@example.com'],
  ] as const;
  for (const [role, email] of accounts) {
    // eslint-disable-next-line no-console
    console.log(`  ${role.padEnd(12)} ${email}`);
  }
  // eslint-disable-next-line no-console
  console.log('--------------------------------\n');
}
