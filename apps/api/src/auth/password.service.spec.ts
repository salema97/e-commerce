import { describe, it, expect } from 'vitest';
import * as argon2 from 'argon2';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords with argon2id', async () => {
    const hash = await service.hash('SeedDemo123!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('my-secret');
    await expect(service.verify(hash, 'my-secret')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('my-secret');
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });

  it('matches hashes produced by seed helper options', async () => {
    const hash = await argon2.hash('SeedDemo123!', {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    await expect(service.verify(hash, 'SeedDemo123!')).resolves.toBe(true);
  });
});
