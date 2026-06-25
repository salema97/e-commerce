import { describe, it, expect } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { resolveStorageConfig } from './storage-config.js';

function mockConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (value === undefined || value === '') {
        throw new Error(`Missing config: ${key}`);
      }
      return value;
    },
  } as ConfigService;
}

describe('resolveStorageConfig', () => {
  it('resolves MinIO settings with path-style public URL', () => {
    const config = resolveStorageConfig(
      mockConfig({
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'access',
        AWS_SECRET_ACCESS_KEY: 'secret',
        AWS_S3_BUCKET: 'e-commerce',
        AWS_S3_ENDPOINT: 'https://s3.salema.dev',
        AWS_S3_FORCE_PATH_STYLE: 'true',
      }),
    );

    expect(config.bucket).toBe('e-commerce');
    expect(config.publicUrl).toBe('https://s3.salema.dev/e-commerce');
    expect(config.client).toEqual({
      region: 'us-east-1',
      endpoint: 'https://s3.salema.dev',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'access',
        secretAccessKey: 'secret',
      },
    });
  });

  it('uses AWS_S3_PUBLIC_URL when provided', () => {
    const config = resolveStorageConfig(
      mockConfig({
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'access',
        AWS_SECRET_ACCESS_KEY: 'secret',
        AWS_S3_BUCKET: 'media',
        AWS_S3_ENDPOINT: 'https://s3.example.com',
        AWS_S3_FORCE_PATH_STYLE: 'true',
        AWS_S3_PUBLIC_URL: 'https://cdn.example.com',
      }),
    );

    expect(config.publicUrl).toBe('https://cdn.example.com');
  });
});
