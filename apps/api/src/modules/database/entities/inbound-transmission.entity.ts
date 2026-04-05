import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum IngestionStatus {
  RECEIVED = 'RECEIVED',
  VERIFIED = 'VERIFIED',
  DECRYPTED = 'DECRYPTED',
  VALIDATED = 'VALIDATED',
  INGESTED = 'INGESTED',
  ERROR = 'ERROR',
}

@Entity('inbound_transmissions')
export class InboundTransmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 2, comment: 'ISO 3166-1 alpha-2' })
  sourceJurisdiction!: string;

  @Column({ type: 'varchar', length: 1024 })
  packageKey!: string;

  @Column({ type: 'boolean', nullable: true })
  signatureValid!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  decryptionOk!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  structuralValid!: boolean | null;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.RECEIVED,
  })
  ingestionStatus!: IngestionStatus;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
