import { Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

/**
 * R2 / S3-compatible storage module.
 *
 * Exposes {@link StorageService} for uploading buffers and generating signed
 * download URLs.
 */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
