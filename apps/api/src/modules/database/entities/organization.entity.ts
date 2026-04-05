import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Filing } from './filing.entity';

export enum OrgType {
  FI = 'FI',
  TAX_AUTHORITY = 'TAX_AUTHORITY',
}

export enum EnrolmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: OrgType })
  orgType!: OrgType;

  @Column({ type: 'varchar', length: 2, comment: 'ISO 3166-1 alpha-2' })
  jurisdiction!: string;

  @Column({ type: 'varchar', length: 19, nullable: true })
  giin!: string | null;

  @Column({
    type: 'enum',
    enum: EnrolmentStatus,
    default: EnrolmentStatus.PENDING,
  })
  enrolmentStatus!: EnrolmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Filing, (filing) => filing.organization)
  filings!: Filing[];
}
