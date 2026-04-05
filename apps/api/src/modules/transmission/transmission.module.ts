import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TransmissionPackage } from '../database/entities/transmission-package.entity';
import { Filing } from '../database/entities/filing.entity';
import { User } from '../database/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { CryptoModule } from '../crypto/crypto.module';
import { ValidationModule } from '../validation/validation.module';
import { FiPortalModule } from '../fi-portal/fi-portal.module';
import { CtsInboundController } from './controllers/cts-inbound.controller';
import { AckNackHandlerService } from './services/ack-nack-handler.service';
import { ReturnDataProcessorService } from './services/return-data-processor.service';
import { ResultDistributorService } from './services/result-distributor.service';
import { InboundTransmissionProcessor } from './processors/inbound-transmission.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransmissionPackage, Filing, User]),
    BullModule.registerQueue({ name: 'inbound-transmission' }),
    StorageModule,
    CryptoModule,
    ValidationModule,
    FiPortalModule,
  ],
  controllers: [CtsInboundController],
  providers: [
    AckNackHandlerService,
    ReturnDataProcessorService,
    ResultDistributorService,
    InboundTransmissionProcessor,
  ],
  exports: [
    AckNackHandlerService,
    ReturnDataProcessorService,
    ResultDistributorService,
  ],
})
export class TransmissionModule {}
