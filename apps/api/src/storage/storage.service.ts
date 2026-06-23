import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  key: string;
}

/**
 * Cloudflare R2 / S3-compatible storage service.
 *
 * Stores arbitrary buffers in a private bucket and generates time-limited
 * signed URLs for secure downloads. Never exposes public URLs.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );

    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload a buffer to R2.
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
  async getSignedUrl(
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
