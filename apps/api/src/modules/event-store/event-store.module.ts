import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from '../database/entities/audit-event.entity';
import { EventStoreService } from './event-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  providers: [EventStoreService],
  exports: [EventStoreService, TypeOrmModule],
})
export class EventStoreModule {}
