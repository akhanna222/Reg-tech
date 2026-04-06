import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../../modules/database/entities/audit-event.entity';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const auditAction =
      this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler()) ??
      `${method} ${request.route?.path ?? request.url}`;

    return next.handle().pipe(
      tap({
        next: () => {
          this.persistEvent(request, auditAction).catch((err) =>
            this.logger.error('Failed to persist audit event', err),
          );
        },
        error: () => {
          // Optionally audit failed requests as well
        },
      }),
    );
  }

  private async persistEvent(
    request: any,
    action: string,
  ): Promise<void> {
    const user = request.user;
    const body = request.body;

    let payloadHash: string | null = null;
    if (body && Object.keys(body).length > 0) {
      payloadHash = createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');
    }

    // Derive resource type and ID from the URL path
    const pathSegments = (request.route?.path ?? request.url)
      .split('/')
      .filter(Boolean);
    const resourceType = pathSegments[0] ?? 'unknown';

    // Attempt to find a UUID resource ID from route params
    const resourceId = request.params?.id ?? null;

    const event = this.auditRepo.create({
      actorId: user?.sub ?? null,
      actorRole: user?.role ?? null,
      action,
      resourceType,
      resourceId,
      jurisdiction: null,
      ipAddress: request.ip ?? request.connection?.remoteAddress ?? null,
      payloadHash,
      metadata: {
        method: request.method,
        path: request.url,
        statusCode: request.res?.statusCode,
      },
    });

    await this.auditRepo.save(event);
  }
}
