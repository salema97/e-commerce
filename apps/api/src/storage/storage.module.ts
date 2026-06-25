import { Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

/**
 * S3-compatible storage module (AWS S3 or MinIO).
 *
 * Exposes {@link StorageService} for uploading buffers and generating signed
 * download URLs.
 */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
