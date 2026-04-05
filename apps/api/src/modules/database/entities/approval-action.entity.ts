import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ApprovalTargetType {
  FILING = 'FILING',
  ENROLMENT = 'ENROLMENT',
}

export enum ApprovalActionType {
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INFO_REQUESTED = 'INFO_REQUESTED',
}

@Entity('approval_actions')
@Index(['targetType', 'targetId'])
export class ApprovalAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ApprovalTargetType })
  targetType!: ApprovalTargetType;

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({ type: 'enum', enum: ApprovalActionType })
  action!: ApprovalActionType;

  @Column({ type: 'uuid' })
  performedBy!: string;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  performedAt!: Date;
}
