import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  resource: string;
  action: string;
}

export const Audit = (metadata: AuditMetadata) => SetMetadata(AUDIT_KEY, metadata);
