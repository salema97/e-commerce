import * as argon2 from 'argon2';

/** Argon2id params for password hashing (OWASP-aligned for server-side auth). */
export const ARGON2_HASH_OPTIONS: argon2.Options & { type: typeof argon2.argon2id } = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};
