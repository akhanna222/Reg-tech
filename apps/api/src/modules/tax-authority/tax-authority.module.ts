import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Filing } from '../database/entities/filing.entity';
import { FilingDocument } from '../database/entities/filing-document.entity';
import { Organization } from '../database/entities/organization.entity';
import { ApprovalAction } from '../database/entities/approval-action.entity';
import { TransmissionPackage } from '../database/entities/transmission-package.entity';
import { StorageModule } from '../storage/storage.module';
import { CryptoModule } from '../crypto/crypto.module';
import { SubmissionBrowserController } from './controllers/submission-browser.controller';
import { ApprovalController } from './controllers/approval.controller';
import { TransmissionController } from './controllers/transmission.controller';
import { SubmissionBrowserService } from './services/submission-browser.service';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { TransmissionPipelineService } from './services/transmission-pipeline.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Filing,
      FilingDocument,
      Organization,
      ApprovalAction,
      TransmissionPackage,
    ]),
    BullModule.registerQueue({ name: 'cts-dispatch' }),
    StorageModule,
    CryptoModule,
  ],
  controllers: [
    SubmissionBrowserController,
    ApprovalController,
    TransmissionController,
  ],
  providers: [
    SubmissionBrowserService,
    ApprovalWorkflowService,
    TransmissionPipelineService,
  ],
  exports: [
    SubmissionBrowserService,
    ApprovalWorkflowService,
    TransmissionPipelineService,
  ],
})
export class TaxAuthorityModule {}
