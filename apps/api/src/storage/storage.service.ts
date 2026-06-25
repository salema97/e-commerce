import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { resolveStorageConfig } from './storage-config.js';

export interface UploadResult {
  key: string;
}

/**
 * S3-compatible storage service (AWS S3 or MinIO).
 *
 * Stores arbitrary buffers in a private bucket and generates time-limited
 * signed URLs for secure downloads.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const storage = resolveStorageConfig(config);
    this.bucket = storage.bucket;
    this.client = new S3Client(storage.client);
  }

  /**
   * Upload a buffer to object storage.
   *
   * @param key Object key (path inside the bucket).
   * @param buffer File content.
   * @param contentType MIME type.
   * @returns The object key only; consumers must request a signed URL to download.
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { key };
  }

  /**
   * Generate a time-limited signed URL for an object.
   *
   * @param key Object key.
   * @param expiresInSeconds URL lifetime in seconds (default 300 = 5 minutes).
   */
  getSignedUrl(
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
