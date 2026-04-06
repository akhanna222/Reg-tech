import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TransmissionPackage } from '../database/entities/transmission-package.entity';
import { InboundTransmission } from '../database/entities/inbound-transmission.entity';
import { AuditEvent } from '../database/entities/audit-event.entity';
import { Filing } from '../database/entities/filing.entity';
import { User } from '../database/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { CryptoModule } from '../crypto/crypto.module';
import { ValidationModule } from '../validation/validation.module';
import { FiPortalModule } from '../fi-portal/fi-portal.module';
import { EventStoreModule } from '../event-store/event-store.module';
import { CtsInboundController } from './controllers/cts-inbound.controller';
import { AckNackHandlerService } from './services/ack-nack-handler.service';
import { ReturnDataProcessorService } from './services/return-data-processor.service';
import { ResultDistributorService } from './services/result-distributor.service';
import { SftpTransportService } from './services/sftp-transport.service';
import { StatusResponseService } from './services/status-response.service';
import { CtsPollingService } from './services/cts-polling.service';
import { InboundTransmissionProcessor } from './processors/inbound-transmission.processor';
import { CtsDispatchProcessor } from './processors/cts-dispatch.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransmissionPackage,
      InboundTransmission,
      AuditEvent,
      Filing,
      User,
    ]),
    BullModule.registerQueue(
      { name: 'inbound-transmission' },
      { name: 'cts-dispatch' },
    ),
    ScheduleModule.forRoot(),
    StorageModule,
    CryptoModule,
    ValidationModule,
    FiPortalModule,
    EventStoreModule,
  ],
  controllers: [CtsInboundController],
  providers: [
    AckNackHandlerService,
    ReturnDataProcessorService,
    ResultDistributorService,
    SftpTransportService,
    StatusResponseService,
    CtsPollingService,
    InboundTransmissionProcessor,
    CtsDispatchProcessor,
  ],
  exports: [
    AckNackHandlerService,
    ReturnDataProcessorService,
    ResultDistributorService,
    SftpTransportService,
    StatusResponseService,
    CtsPollingService,
  ],
})
export class TransmissionModule {}
