import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';
import { NotificationService } from '../../fi-portal/services/notification.service';
import { Filing } from '../../database/entities/filing.entity';

export interface AckPayload {
  messageRefId: string;
  timestamp: string;
  status: string;
  details?: string;
}

export interface NackPayload {
  messageRefId: string;
  timestamp: string;
  errorCode: string;
  errorDescription: string;
  details?: string;
}

@Injectable()
export class AckNackHandlerService {
  private readonly logger = new Logger(AckNackHandlerService.name);

  constructor(
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    @InjectRepository(Filing)
    private readonly filingRepository: Repository<Filing>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Process an ACK (acknowledgement) for a transmission.
   * Updates transmission status and notifies the FI.
   */
  async processAck(
    transmissionId: string,
    ackPayload: AckPayload,
  ): Promise<TransmissionPackage> {
    const transmission = await this.transmissionRepository.findOne({
      where: { id: transmissionId },
    });

    if (!transmission) {
      throw new NotFoundException(`Transmission not found: ${transmissionId}`);
    }

    transmission.status = TransmissionStatus.ACK;
    transmission.ackReceivedAt = new Date();
    transmission.ackPayload = ackPayload as any;

    const saved = await this.transmissionRepository.save(transmission);

    // Notify the submitting FI
    const filing = await this.filingRepository.findOne({
      where: { id: transmission.filingId },
    });

    if (filing?.submittedBy) {
      await this.notificationService.createNotification({
        userId: filing.submittedBy,
        type: 'TRANSMISSION_ACK',
        title: 'Transmission Acknowledged',
        body: `Your filing for period ${filing.reportingPeriod} has been acknowledged by the receiving jurisdiction.`,
        resourceType: 'TRANSMISSION',
        resourceId: transmissionId,
      });
    }

    this.logger.log(
      `ACK processed for transmission ${transmissionId}, filing ${transmission.filingId}`,
    );

    return saved;
  }

  /**
   * Process a NACK (negative acknowledgement) for a transmission.
   * Updates transmission status, reverts filing status, and notifies the FI.
   */
  async processNack(
    transmissionId: string,
    nackPayload: NackPayload,
  ): Promise<TransmissionPackage> {
    const transmission = await this.transmissionRepository.findOne({
      where: { id: transmissionId },
    });

    if (!transmission) {
      throw new NotFoundException(`Transmission not found: ${transmissionId}`);
    }

    transmission.status = TransmissionStatus.NACK;
    transmission.ackReceivedAt = new Date();
    transmission.ackPayload = nackPayload as any;

    const saved = await this.transmissionRepository.save(transmission);

    // Revert the filing status back to VALIDATED so it can be retransmitted
    await this.filingRepository.update(transmission.filingId, {
      status: 'VALIDATED' as any,
    });

    // Notify the submitting FI
    const filing = await this.filingRepository.findOne({
      where: { id: transmission.filingId },
    });

    if (filing?.submittedBy) {
      await this.notificationService.createNotification({
        userId: filing.submittedBy,
        type: 'TRANSMISSION_NACK',
        title: 'Transmission Rejected',
        body: `Your filing for period ${filing.reportingPeriod} was rejected by the receiving jurisdiction: ${nackPayload.errorDescription}`,
        resourceType: 'TRANSMISSION',
        resourceId: transmissionId,
      });
    }

    this.logger.log(
      `NACK processed for transmission ${transmissionId}: ${nackPayload.errorCode}`,
    );

    return saved;
  }
}
