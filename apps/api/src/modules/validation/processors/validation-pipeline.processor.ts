import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Filing, FilingStatus } from '../../database/entities/filing.entity';
import { FilingDocument } from '../../database/entities/filing-document.entity';
import {
  ValidationResult,
  ValidationStage,
  ValidationStatus,
} from '../../database/entities/validation-result.entity';
import { XsdValidatorService } from '../services/xsd-validator.service';
import { BusinessRulesService } from '../services/business-rules.service';
import { CrossRecordValidatorService } from '../services/cross-record-validator.service';
import { JurisdictionRulesService } from '../services/jurisdiction-rules.service';
import { RawStorageService } from '../../storage/raw-storage.service';

interface ValidationJobData {
  filingId: string;
  submittedBy?: string;
}

@Processor('validation')
export class ValidationPipelineProcessor {
  private readonly logger = new Logger(ValidationPipelineProcessor.name);

  constructor(
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(FilingDocument)
    private readonly filingDocumentRepository: Repository<FilingDocument>,
    @InjectRepository(ValidationResult)
    private readonly validationResultRepository: Repository<ValidationResult>,
    private readonly xsdValidator: XsdValidatorService,
    private readonly businessRules: BusinessRulesService,
    private readonly crossRecordValidator: CrossRecordValidatorService,
    private readonly jurisdictionRules: JurisdictionRulesService,
    private readonly rawStorage: RawStorageService,
  ) {}

  @Process('validate-filing')
  async handleValidation(job: Job<ValidationJobData>): Promise<void> {
    const { filingId } = job.data;
    this.logger.log(`Starting validation pipeline for filing ${filingId}`);

    let allPassed = true;

    try {
      // Load the filing and its documents
      const filing = await this.filingRepository.findOne({
        where: { id: filingId },
        relations: ['organization'],
      });

      if (!filing) {
        this.logger.error(`Filing not found: ${filingId}`);
        return;
      }

      const documents = await this.filingDocumentRepository.find({
        where: { filingId },
      });

      if (documents.length === 0) {
        await this.saveResult(filingId, ValidationStage.XSD, ValidationStatus.FAIL, [
          { message: 'No documents uploaded for this filing' },
        ]);
        await this.updateFilingStatus(filingId, FilingStatus.REJECTED);
        return;
      }

      // Download the latest XML document
      const latestDoc = documents[documents.length - 1];
      const xmlBuffer = await this.rawStorage.download(latestDoc.storageKey);
      const xmlContent = xmlBuffer.toString('utf-8');

      // Stage 1: XSD Validation
      await job.progress(10);
      const xsdResult = await this.xsdValidator.validateXsd(
        xmlContent,
        filing.filingType as 'CRS' | 'FATCA',
      );
      await this.saveResult(
        filingId,
        ValidationStage.XSD,
        xsdResult.valid ? ValidationStatus.PASS : ValidationStatus.FAIL,
        xsdResult.errors.map((e) => ({ ...e })),
      );
      if (!xsdResult.valid) {
        allPassed = false;
        // XSD failure is fatal - skip remaining stages
        await this.updateFilingStatus(filingId, FilingStatus.REJECTED);
        this.logger.log(`Filing ${filingId} rejected at XSD stage`);
        return;
      }

      // Stage 2: Business Rules
      await job.progress(30);
      // Parse XML into a structured object for business rules
      const parsedData = this.parseXmlToData(xmlContent);
      const brResult = await this.businessRules.validateBusinessRules(
        parsedData,
        filing.organization.jurisdiction,
      );
      await this.saveResult(
        filingId,
        ValidationStage.BUSINESS_RULES,
        brResult.valid ? ValidationStatus.PASS : ValidationStatus.FAIL,
        brResult.violations.filter((v) => v.severity === 'ERROR'),
        brResult.violations.filter((v) => v.severity === 'WARNING'),
      );
      if (!brResult.valid) allPassed = false;

      // Stage 3: Cross-Record Validation
      await job.progress(60);
      const accounts = (parsedData.accounts ?? []) as Record<string, unknown>[];
      const crResult = await this.crossRecordValidator.validateCrossRecord(accounts);
      await this.saveResult(
        filingId,
        ValidationStage.CROSS_RECORD,
        crResult.valid ? ValidationStatus.PASS : ValidationStatus.FAIL,
        crResult.violations.filter((v) => v.severity === 'ERROR'),
        crResult.violations.filter((v) => v.severity === 'WARNING'),
      );
      if (!crResult.valid) allPassed = false;

      // Stage 4: Jurisdiction Rules
      await job.progress(80);
      const jrResult = await this.jurisdictionRules.evaluateRules(
        parsedData,
        filing.organization.jurisdiction,
      );
      await this.saveResult(
        filingId,
        ValidationStage.JURISDICTION,
        jrResult.valid ? ValidationStatus.PASS : ValidationStatus.FAIL,
        jrResult.violations.filter((v) => v.severity === 'ERROR'),
        jrResult.violations.filter((v) => v.severity === 'WARNING'),
      );
      if (!jrResult.valid) allPassed = false;

      // Update filing status based on overall result
      const finalStatus = allPassed
        ? FilingStatus.VALIDATED
        : FilingStatus.REJECTED;
      await this.updateFilingStatus(filingId, finalStatus);

      await job.progress(100);
      this.logger.log(
        `Validation pipeline complete for filing ${filingId}: ${finalStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Validation pipeline error for filing ${filingId}`,
        error,
      );
      await this.updateFilingStatus(filingId, FilingStatus.REJECTED);
    }
  }

  private async saveResult(
    filingId: string,
    stage: ValidationStage,
    status: ValidationStatus,
    errors: Record<string, unknown>[] = [],
    warnings: Record<string, unknown>[] = [],
  ): Promise<void> {
    const result = this.validationResultRepository.create({
      filingId,
      stage,
      status,
      errors,
      warnings,
      executedAt: new Date(),
    });
    await this.validationResultRepository.save(result);
  }

  private async updateFilingStatus(
    filingId: string,
    status: FilingStatus,
  ): Promise<void> {
    await this.filingRepository.update(filingId, { status });
  }

  /**
   * Basic XML-to-data parser. In production, use a proper XML parser.
   * Returns a structured object for business rule evaluation.
   */
  private parseXmlToData(xmlContent: string): Record<string, unknown> {
    // Placeholder: extract basic structure from XML
    // A full implementation would use fast-xml-parser or similar
    return {
      rawXml: xmlContent,
      accounts: [],
      reportingFI: {},
      messageSpec: {},
    };
  }
}
