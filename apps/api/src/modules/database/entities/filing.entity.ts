import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { FilingDocument } from './filing-document.entity';
import { ValidationResult } from './validation-result.entity';

export enum FilingType {
  CRS = 'CRS',
  FATCA = 'FATCA',
}

export enum FilingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  TRANSMITTED = 'TRANSMITTED',
}

@Entity('filings')
@Index(['organizationId', 'reportingPeriod'])
export class Filing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 10, comment: 'e.g. 2025' })
  reportingPeriod!: string;

  @Column({ type: 'enum', enum: FilingType })
  filingType!: FilingType;

  @Column({
    type: 'enum',
    enum: FilingStatus,
    default: FilingStatus.DRAFT,
  })
  status!: FilingStatus;

  @Column({ type: 'uuid', nullable: true })
  submittedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Organization, (org) => org.filings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @OneToMany(() => FilingDocument, (doc) => doc.filing)
  documents!: FilingDocument[];

  @OneToMany(() => ValidationResult, (vr) => vr.filing)
  validationResults!: ValidationResult[];
}
