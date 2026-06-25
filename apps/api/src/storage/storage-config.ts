import type { ConfigService } from '@nestjs/config';
import type { S3ClientConfig } from '@aws-sdk/client-s3';

export interface ResolvedStorageConfig {
  bucket: string;
  publicUrl?: string;
  client: Pick<S3ClientConfig, 'region' | 'endpoint' | 'credentials' | 'forcePathStyle'>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Resolves AWS S3 / MinIO settings from environment variables. */
export function resolveStorageConfig(config: ConfigService): ResolvedStorageConfig {
  const bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
  const endpoint = trimTrailingSlash(config.getOrThrow<string>('AWS_S3_ENDPOINT'));
  const forcePathStyle = config.get<string>('AWS_S3_FORCE_PATH_STYLE') !== 'false';
  const publicUrl =
    config.get<string>('AWS_S3_PUBLIC_URL') ??
    (forcePathStyle ? `${endpoint}/${bucket}` : endpoint);

  return {
    bucket,
    publicUrl,
    client: {
      region: config.getOrThrow<string>('AWS_REGION'),
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    },
  };
}
