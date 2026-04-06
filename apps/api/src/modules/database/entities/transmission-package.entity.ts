import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransmissionStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  ACK = 'ACK',
  NACK = 'NACK',
  ERROR = 'ERROR',
}

@Entity('transmission_packages')
@Index(['filingId'])
export class TransmissionPackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  filingId!: string;

  @Column({ type: 'varchar', length: 255 })
  destination!: string;

  @Column({ type: 'varchar', length: 1024 })
  packageKey!: string;

  @Column({ type: 'text', nullable: true })
  signature!: string | null;

  @Column({
    type: 'enum',
    enum: TransmissionStatus,
    default: TransmissionStatus.PENDING,
  })
  status!: TransmissionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  dispatchedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  ackReceivedAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  ackPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
