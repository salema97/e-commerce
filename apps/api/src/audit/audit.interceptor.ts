import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service.js';
import { AuditBeforeStateRegistry } from './audit-before-state.registry.js';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator.js';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditBeforeState: AuditBeforeStateRegistry,
    private readonly auditLogService: AuditLogService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const id = (request.params?.id as string | undefined) ?? undefined;
    const before = id ? await this.loadBeforeState(metadata, id) : null;

    return next.handle().pipe(
      concatMap(async (response) => {
        const after = this.isDelete(request) ? null : response;
        const resourceId = this.extractResourceId(id, response);

        await this.auditLogService.log({
          actorId: request.user?.userId ?? null,
          resource: metadata.resource,
          action: metadata.action,
          resourceId,
          before,
          after,
          metadata: {
            actorType: request.user ? 'user' : 'system',
            path: request.path || request.url,
            method: request.method,
          },
        });

        return response;
      }),
    );
  }

  private async loadBeforeState(
    metadata: AuditMetadata,
    id: string,
  ): Promise<unknown | null> {
    return await this.auditBeforeState.load(metadata.resource, id);
  }

  private isDelete(request: AuthenticatedRequest): boolean {
    return request.method === 'DELETE';
  }

  private extractResourceId(
    idFromParams: string | undefined,
    response: unknown,
  ): string | null {
    if (idFromParams) {
      return idFromParams;
    }

    if (
      response &&
      typeof response === 'object' &&
      'id' in response &&
      typeof response.id === 'string'
    ) {
      return response.id;
    }

    return null;
  }
}
