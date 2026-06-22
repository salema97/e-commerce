import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service.js';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator.js';
import { AuthenticatedRequest } from '../auth/clerk-jwt.guard.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
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
    const before = id ? await this.loadBeforeState(context, id) : null;

    return next.handle().pipe(
      concatMap(async (response) => {
        const after = this.isDelete(request) ? null : response;
        const resourceId = this.extractResourceId(id, response);

        await this.auditLogService.log({
          actorClerkUserId: request.user?.userId ?? 'system',
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
    context: ExecutionContext,
    id: string,
  ): Promise<unknown | null> {
    try {
      const controllerClass = context.getClass();
      const controllerInstance = this.moduleRef.get(controllerClass, {
        strict: false,
      });
      const service = this.findService(controllerInstance);

      if (
        service &&
        typeof service === 'object' &&
        'findOne' in service &&
        typeof service.findOne === 'function'
      ) {
        return await (service.findOne as (id: string) => Promise<unknown>)(id);
      }
    } catch {
      // Before-state loading is best-effort; ignore failures so the
      // primary mutation is never blocked by audit bookkeeping.
    }

    return null;
  }

  private findService(controllerInstance: object): unknown {
    for (const key of Object.keys(controllerInstance)) {
      const value = (controllerInstance as Record<string, unknown>)[key];
      if (
        key.endsWith('Service') &&
        value !== null &&
        value !== undefined
      ) {
        return value;
      }
    }

    return null;
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
