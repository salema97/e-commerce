import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './storage.service.js';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(function () {
    this.send = vi.fn().mockResolvedValue({});
  }),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example.com/doc'),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                R2_ACCOUNT_ID: 'account',
                R2_ACCESS_KEY_ID: 'access',
                R2_SECRET_ACCESS_KEY: 'secret',
                R2_BUCKET_NAME: 'bucket',
                R2_PUBLIC_URL: 'https://public.example.com',
              };
              return values[key] ?? '';
            },
          },
        },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  it('uploads a buffer and returns the public URL', async () => {
    const result = await service.uploadBuffer(
      'sri/invoices/1/ride.pdf',
      Buffer.from('pdf'),
      'application/pdf',
    );

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'bucket',
        Key: 'sri/invoices/1/ride.pdf',
        Body: Buffer.from('pdf'),
        ContentType: 'application/pdf',
      }),
    );
    expect(result).toEqual({
      key: 'sri/invoices/1/ride.pdf',
      publicUrl: 'https://public.example.com/sri/invoices/1/ride.pdf',
    });
  });

  it('returns a signed URL with default expiry', async () => {
    const url = await service.getSignedUrl('sri/invoices/1/ride.pdf');

    expect(GetObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'bucket',
        Key: 'sri/invoices/1/ride.pdf',
      }),
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(GetObjectCommand),
      { expiresIn: 300 },
    );
    expect(url).toBe('https://signed.example.com/doc');
  });

  it('configures the S3 client with the R2 endpoint', () => {
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'auto',
        endpoint: 'https://account.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'access',
          secretAccessKey: 'secret',
        },
      }),
    );
  });
});
