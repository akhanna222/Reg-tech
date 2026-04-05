import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Filing } from './filing.entity';

@Entity('filing_documents')
export class FilingDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  filingId!: string;

  @Column({ type: 'varchar', length: 1024 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 128, comment: 'SHA-256 hex digest' })
  fileHash!: string;

  @Column({ type: 'bigint' })
  fileSize!: string; // bigint columns are returned as strings by pg driver

  @Column({ type: 'varchar', length: 255 })
  contentType!: string;

  @Column({ type: 'uuid' })
  uploadedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  uploadedAt!: Date;

  @ManyToOne(() => Filing, (filing) => filing.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filingId' })
  filing!: Filing;
}
