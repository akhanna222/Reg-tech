import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Organization } from '../database/entities/organization.entity';
import { Filing } from '../database/entities/filing.entity';
import { FilingDocument } from '../database/entities/filing-document.entity';
import { StorageModule } from '../storage/storage.module';
import { EnrolmentController } from './controllers/enrolment.controller';
import { FilingController } from './controllers/filing.controller';
import { NotificationController } from './controllers/notification.controller';
import { EnrolmentService } from './services/enrolment.service';
import { FilingService } from './services/filing.service';
import { XmlUploadService } from './services/xml-upload.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Filing,
      FilingDocument,
    ]),
    BullModule.registerQueue({ name: 'validation' }),
    StorageModule,
  ],
  controllers: [
    EnrolmentController,
    FilingController,
    NotificationController,
  ],
  providers: [
    EnrolmentService,
    FilingService,
    XmlUploadService,
    NotificationService,
  ],
  exports: [
    EnrolmentService,
    FilingService,
    NotificationService,
  ],
})
export class FiPortalModule {}
