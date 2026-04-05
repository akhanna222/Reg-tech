import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../database/entities/audit-event.entity';

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  /**
   * Append an immutable event to the audit event store.
   * This is an append-only operation; no update or delete methods are exposed.
   */
  async appendEvent(
    type: string,
    data: {
      actorId?: string | null;
      actorRole?: string | null;
      resourceType: string;
      resourceId?: string | null;
      jurisdiction?: string | null;
      ipAddress?: string | null;
      payloadHash?: string | null;
    },
    metadata?: Record<string, unknown> | null,
  ): Promise<AuditEvent> {
    const event = this.auditRepo.create({
      actorId: data.actorId ?? null,
      actorRole: data.actorRole ?? null,
      action: type,
      resourceType: data.resourceType,
      resourceId: data.resourceId ?? null,
      jurisdiction: data.jurisdiction ?? null,
      ipAddress: data.ipAddress ?? null,
      payloadHash: data.payloadHash ?? null,
      metadata: metadata ?? null,
    });

    return this.auditRepo.save(event);
  }

  /**
   * Retrieve all events for a given resource, ordered chronologically.
   * Supports event replay / audit trail queries.
   */
  async getEvents(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEvent[]> {
    return this.auditRepo.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'ASC' },
    });
  }
}
