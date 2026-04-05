export enum ValidationStage {
  XSD = 'XSD',
  BUSINESS_RULES = 'BUSINESS_RULES',
  CROSS_RECORD = 'CROSS_RECORD',
  JURISDICTION = 'JURISDICTION',
}

export enum ValidationStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
}

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationError {
  code: string;
  message: string;
  field: string | null;
  line: number | null;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  id: string;
  filingId: string;
  stage: ValidationStage;
  status: ValidationStatus;
  errors: ValidationError[];
  warnings: ValidationError[];
  executedAt: string;
  ruleVersion: string;
}
