import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ARGON2_HASH_OPTIONS } from './argon2-options.js';

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_HASH_OPTIONS);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
