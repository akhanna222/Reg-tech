import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('jurisdiction_rules')
@Index(['jurisdiction', 'ruleName', 'version'], { unique: true })
export class JurisdictionRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 2, comment: 'ISO 3166-1 alpha-2' })
  jurisdiction!: string;

  @Column({ type: 'varchar', length: 255 })
  ruleName!: string;

  @Column({ type: 'jsonb' })
  ruleDefinition!: Record<string, unknown>;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'date' })
  effectiveFrom!: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
