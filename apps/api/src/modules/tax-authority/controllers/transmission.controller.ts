import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TransmissionPipelineService } from '../services/transmission-pipeline.service';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';

@ApiTags('Tax Authority - Transmission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TA_APPROVER', 'TA_ADMIN')
@Controller('ta')
export class TransmissionController {
  constructor(
    private readonly transmissionPipeline: TransmissionPipelineService,
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
  ) {}

  @Post('submissions/:id/transmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger the 7-step transmission pipeline for a filing' })
  @ApiResponse({ status: 200, description: 'Transmission dispatched' })
  @ApiResponse({ status: 400, description: 'Filing not in VALIDATED status' })
  @ApiResponse({ status: 404, description: 'Filing not found' })
  async transmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.transmissionPipeline.transmit(id, req.user.id);
  }

  @Get('transmissions')
  @ApiOperation({ summary: 'List transmission packages' })
  @ApiQuery({ name: 'status', required: false, enum: TransmissionStatus })
  @ApiQuery({ name: 'destination', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transmissions' })
  async listTransmissions(
    @Query('status') status?: TransmissionStatus,
    @Query('destination') destination?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;

    const qb = this.transmissionRepository
      .createQueryBuilder('tp')
      .orderBy('tp.createdAt', 'DESC');

    if (status) {
      qb.andWhere('tp.status = :status', { status });
    }
    if (destination) {
      qb.andWhere('tp.destination = :destination', { destination: destination.toUpperCase() });
    }

    qb.skip((pageNum - 1) * limitNum).take(limitNum);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
