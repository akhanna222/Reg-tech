import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Organization,
  OrgType,
  EnrolmentStatus,
} from '../../database/entities/organization.entity';
import { CreateEnrolmentDto } from '../dto/create-enrolment.dto';

export interface EnrolmentStatusResponse {
  organizationId: string;
  institutionName: string;
  status: EnrolmentStatus;
  jurisdiction: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EnrolmentService {
  private readonly logger = new Logger(EnrolmentService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async createEnrolment(
    dto: CreateEnrolmentDto,
    userId: string,
  ): Promise<Organization> {
    // Check for duplicate enrolment by GIIN if provided
    if (dto.giin) {
      const existing = await this.organizationRepository.findOne({
        where: { giin: dto.giin },
      });
      if (existing) {
        throw new ConflictException(
          `An organization with GIIN ${dto.giin} is already enrolled`,
        );
      }
    }

    const organization = this.organizationRepository.create({
      name: dto.institutionName,
      orgType: OrgType.FI,
      jurisdiction: dto.jurisdiction,
      giin: dto.giin ?? null,
      enrolmentStatus: EnrolmentStatus.PENDING,
    });

    const saved = await this.organizationRepository.save(organization);
    this.logger.log(
      `Enrolment created: org=${saved.id}, user=${userId}, jurisdiction=${dto.jurisdiction}`,
    );

    return saved;
  }

  async getEnrolmentStatus(id: string): Promise<EnrolmentStatusResponse> {
    const org = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException(`Enrolment not found: ${id}`);
    }

    return {
      organizationId: org.id,
      institutionName: org.name,
      status: org.enrolmentStatus,
      jurisdiction: org.jurisdiction,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
