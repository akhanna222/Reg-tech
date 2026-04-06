import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Filing } from './filing.entity';

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

@Entity('validation_results')
export class ValidationResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  filingId!: string;

  @Column({ type: 'enum', enum: ValidationStage })
  stage!: ValidationStage;

  @Column({ type: 'enum', enum: ValidationStatus })
  status!: ValidationStatus;

  @Column({ type: 'jsonb', default: [] })
  errors!: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  warnings!: Record<string, unknown>[];

  @Column({ type: 'timestamptz' })
  executedAt!: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ruleVersion!: string | null;

  @ManyToOne(() => Filing, (filing) => filing.validationResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'filingId' })
  filing!: Filing;
}
