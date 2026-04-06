import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApprovalAction,
  ApprovalTargetType,
  ApprovalActionType,
} from '../../database/entities/approval-action.entity';
import { Filing, FilingStatus } from '../../database/entities/filing.entity';
import {
  Organization,
  EnrolmentStatus,
} from '../../database/entities/organization.entity';

@Injectable()
export class ApprovalWorkflowService {
  private readonly logger = new Logger(ApprovalWorkflowService.name);

  constructor(
    @InjectRepository(ApprovalAction)
    private readonly approvalActionRepository: Repository<ApprovalAction>,
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async approve(
    targetType: ApprovalTargetType,
    targetId: string,
    userId: string,
    comments?: string,
  ): Promise<ApprovalAction> {
    await this.validateTarget(targetType, targetId);

    // Create the approval action record
    const action = this.approvalActionRepository.create({
      targetType,
      targetId,
      action: ApprovalActionType.APPROVED,
      performedBy: userId,
      comments: comments ?? null,
    });
    const saved = await this.approvalActionRepository.save(action);

    // Update the target's status
    if (targetType === ApprovalTargetType.FILING) {
      await this.filingRepository.update(targetId, {
        status: FilingStatus.VALIDATED,
      });
    } else if (targetType === ApprovalTargetType.ENROLMENT) {
      await this.organizationRepository.update(targetId, {
        enrolmentStatus: EnrolmentStatus.APPROVED,
      });
    }

    this.logger.log(
      `${targetType} ${targetId} approved by user ${userId}`,
    );

    return saved;
  }

  async reject(
    targetType: ApprovalTargetType,
    targetId: string,
    userId: string,
    comments?: string,
  ): Promise<ApprovalAction> {
    await this.validateTarget(targetType, targetId);

    const action = this.approvalActionRepository.create({
      targetType,
      targetId,
      action: ApprovalActionType.REJECTED,
      performedBy: userId,
      comments: comments ?? null,
    });
    const saved = await this.approvalActionRepository.save(action);

    if (targetType === ApprovalTargetType.FILING) {
      await this.filingRepository.update(targetId, {
        status: FilingStatus.REJECTED,
      });
    } else if (targetType === ApprovalTargetType.ENROLMENT) {
      await this.organizationRepository.update(targetId, {
        enrolmentStatus: EnrolmentStatus.REJECTED,
      });
    }

    this.logger.log(
      `${targetType} ${targetId} rejected by user ${userId}`,
    );

    return saved;
  }

  async getApprovalHistory(
    targetType: ApprovalTargetType,
    targetId: string,
  ): Promise<ApprovalAction[]> {
    return this.approvalActionRepository.find({
      where: { targetType, targetId },
      order: { performedAt: 'DESC' },
    });
  }

  private async validateTarget(
    targetType: ApprovalTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === ApprovalTargetType.FILING) {
      const filing = await this.filingRepository.findOne({
        where: { id: targetId },
      });
      if (!filing) {
        throw new NotFoundException(`Filing not found: ${targetId}`);
      }
      if (
        filing.status !== FilingStatus.SUBMITTED &&
        filing.status !== FilingStatus.VALIDATED
      ) {
        throw new BadRequestException(
          `Filing must be in SUBMITTED or VALIDATED status for approval. Current: ${filing.status}`,
        );
      }
    } else if (targetType === ApprovalTargetType.ENROLMENT) {
      const org = await this.organizationRepository.findOne({
        where: { id: targetId },
      });
      if (!org) {
        throw new NotFoundException(`Organization not found: ${targetId}`);
      }
      if (org.enrolmentStatus !== EnrolmentStatus.PENDING) {
        throw new BadRequestException(
          `Enrolment must be in PENDING status. Current: ${org.enrolmentStatus}`,
        );
      }
    }
  }
}
