import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransmissionPackage } from '../../database/entities/transmission-package.entity';
import { NotificationService } from '../../fi-portal/services/notification.service';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class ResultDistributorService {
  private readonly logger = new Logger(ResultDistributorService.name);

  constructor(
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Distribute results of an inbound transmission to relevant TA users and FIs.
   * Creates notifications and feeds data to analytics.
   */
  async distributeResults(inboundId: string): Promise<{ notified: number }> {
    const transmission = await this.transmissionRepository.findOne({
      where: { id: inboundId },
    });

    if (!transmission) {
      throw new NotFoundException(`Transmission not found: ${inboundId}`);
    }

    const ackPayload = transmission.ackPayload as Record<string, unknown> | null;
    const sourceJurisdiction =
      (ackPayload?.sourceJurisdiction as string) ?? transmission.destination;

    let notifiedCount = 0;

    // Notify TA users (reviewers and approvers)
    const taUsers = await this.userRepository.find({
      where: [
        { role: UserRole.TA_REVIEWER },
        { role: UserRole.TA_APPROVER },
        { role: UserRole.TA_ADMIN },
      ],
    });

    for (const user of taUsers) {
      await this.notificationService.createNotification({
        userId: user.id,
        type: 'INBOUND_DATA_RECEIVED',
        title: 'Inbound Data Received',
        body: `New data package received from jurisdiction ${sourceJurisdiction}. Ready for review.`,
        resourceType: 'TRANSMISSION',
        resourceId: inboundId,
      });
      notifiedCount++;
    }

    // Notify relevant FI admins (organizations in the destination jurisdiction)
    const fiAdmins = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.organization', 'org')
      .where('user.role IN (:...roles)', {
        roles: [UserRole.FI_ADMIN],
      })
      .andWhere('org.jurisdiction = :jurisdiction', {
        jurisdiction: sourceJurisdiction,
      })
      .getMany();

    for (const fiAdmin of fiAdmins) {
      await this.notificationService.createNotification({
        userId: fiAdmin.id,
        type: 'RETURN_DATA_AVAILABLE',
        title: 'Return Data Available',
        body: `Return data from ${sourceJurisdiction} is now available for your organization.`,
        resourceType: 'TRANSMISSION',
        resourceId: inboundId,
      });
      notifiedCount++;
    }

    this.logger.log(
      `Results distributed for transmission ${inboundId}: ${notifiedCount} users notified`,
    );

    return { notified: notifiedCount };
  }
}
