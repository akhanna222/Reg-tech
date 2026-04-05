import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Filing } from '../database/entities/filing.entity';
import { FilingDocument } from '../database/entities/filing-document.entity';
import { ValidationResult } from '../database/entities/validation-result.entity';
import { JurisdictionRule } from '../database/entities/jurisdiction-rule.entity';
import { StorageModule } from '../storage/storage.module';
import { ValidationController } from './controllers/validation.controller';
import { ValidationPipelineService } from './services/validation-pipeline.service';
import { XsdValidatorService } from './services/xsd-validator.service';
import { BusinessRulesService } from './services/business-rules.service';
import { CrossRecordValidatorService } from './services/cross-record-validator.service';
import { JurisdictionRulesService } from './services/jurisdiction-rules.service';
import { RulesEngineService } from './rules/rules-engine.service';
import { ValidationPipelineProcessor } from './processors/validation-pipeline.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Filing,
      FilingDocument,
      ValidationResult,
      JurisdictionRule,
    ]),
    BullModule.registerQueue({ name: 'validation' }),
    StorageModule,
  ],
  controllers: [ValidationController],
  providers: [
    ValidationPipelineService,
    XsdValidatorService,
    BusinessRulesService,
    CrossRecordValidatorService,
    JurisdictionRulesService,
    RulesEngineService,
    ValidationPipelineProcessor,
  ],
  exports: [
    ValidationPipelineService,
    XsdValidatorService,
    BusinessRulesService,
  ],
})
export class ValidationModule {}
