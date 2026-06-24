export interface AuditDiff {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedFields: string[];
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  resource: string;
  action: string;
  resourceId?: string | null;
  diff?: AuditDiff | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: unknown;
}

export interface AuditLogEvent {
  actorId?: string | null;
  resource: string;
  action: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}
