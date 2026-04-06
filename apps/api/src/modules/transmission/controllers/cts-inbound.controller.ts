import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
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
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AckNackHandlerService } from '../services/ack-nack-handler.service';
import { CtsPollingService } from '../services/cts-polling.service';
import { SftpTransportService } from '../services/sftp-transport.service';
import {
  TransmissionPackage,
  TransmissionStatus,
} from '../../database/entities/transmission-package.entity';

class InboundPackageDto {
  @IsString()
  @IsNotEmpty()
  packageBase64!: string;

  @IsString()
  @IsNotEmpty()
  sourceJurisdiction!: string;
}

class AckDto {
  @IsString()
  messageRefId!: string;

  @IsString()
  status!: string;

  timestamp?: string;
  details?: string;
}

class NackDto {
  @IsString()
  messageRefId!: string;

  @IsString()
  errorCode!: string;

  @IsString()
  errorDescription!: string;

  timestamp?: string;
  details?: string;
}

@ApiTags('Transmission - Inbound')
@ApiBearerAuth()
@Controller()
export class CtsInboundController {
  constructor(
    @InjectQueue('inbound-transmission')
    private readonly inboundQueue: Queue,
    @InjectRepository(TransmissionPackage)
    private readonly transmissionRepository: Repository<TransmissionPackage>,
    private readonly ackNackHandler: AckNackHandlerService,
    private readonly ctsPolling: CtsPollingService,
    private readonly sftpTransport: SftpTransportService,
  ) {}

  @Post('cts/inbound')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Webhook endpoint for receiving packages from CTS' })
  @ApiResponse({ status: 202, description: 'Package accepted for processing' })
  async receiveInbound(@Body() dto: InboundPackageDto) {
    const job = await this.inboundQueue.add('process-inbound', {
      packageBase64: dto.packageBase64,
      sourceJurisdiction: dto.sourceJurisdiction,
      receivedAt: new Date().toISOString(),
    });

    return {
      accepted: true,
      jobId: String(job.id),
      message: `Inbound package from ${dto.sourceJurisdiction} queued for processing`,
    };
  }

  @Post('cts/ack/:transmissionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process ACK for a transmission' })
  @ApiResponse({ status: 200, description: 'ACK processed' })
  async processAck(
    @Param('transmissionId', ParseUUIDPipe) transmissionId: string,
    @Body() dto: AckDto,
  ) {
    return this.ackNackHandler.processAck(transmissionId, {
      messageRefId: dto.messageRefId,
      timestamp: dto.timestamp ?? new Date().toISOString(),
      status: dto.status,
      details: dto.details,
    });
  }

  @Post('cts/nack/:transmissionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process NACK for a transmission' })
  @ApiResponse({ status: 200, description: 'NACK processed' })
  async processNack(
    @Param('transmissionId', ParseUUIDPipe) transmissionId: string,
    @Body() dto: NackDto,
  ) {
    return this.ackNackHandler.processNack(transmissionId, {
      messageRefId: dto.messageRefId,
      timestamp: dto.timestamp ?? new Date().toISOString(),
      errorCode: dto.errorCode,
      errorDescription: dto.errorDescription,
      details: dto.details,
    });
  }

  @Get('inbound')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_REVIEWER', 'TA_APPROVER', 'TA_ADMIN')
  @ApiOperation({ summary: 'List inbound transmissions' })
  @ApiQuery({ name: 'status', required: false, enum: TransmissionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of inbound transmissions' })
  async listInbound(
    @Query('status') status?: TransmissionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;

    const qb = this.transmissionRepository
      .createQueryBuilder('tp')
      .where("tp.ackPayload->>'direction' = :direction", {
        direction: 'INBOUND',
      })
      .orderBy('tp.createdAt', 'DESC');

    if (status) {
      qb.andWhere('tp.status = :status', { status });
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

  @Get('transmission/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get transmission status' })
  @ApiResponse({ status: 200, description: 'Transmission status' })
  @ApiResponse({ status: 404, description: 'Transmission not found' })
  async getTransmissionStatus(@Param('id', ParseUUIDPipe) id: string) {
    const transmission = await this.transmissionRepository.findOne({
      where: { id },
    });

    if (!transmission) {
      return { error: 'Transmission not found' };
    }

    return {
      id: transmission.id,
      filingId: transmission.filingId,
      destination: transmission.destination,
      status: transmission.status,
      dispatchedAt: transmission.dispatchedAt,
      ackReceivedAt: transmission.ackReceivedAt,
    };
  }

  // ────────────────────────────────────────────
  // CTS Polling Endpoints
  // ────────────────────────────────────────────

  @Post('cts/poll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger CTS inbox poll for all configured jurisdictions',
  })
  @ApiResponse({
    status: 200,
    description: 'Poll results for all jurisdictions',
  })
  async pollAll() {
    const results = await this.ctsPolling.pollAllJurisdictions();
    const totalNew = results.reduce((sum, r) => sum + r.newPackages, 0);
    const errors = results
      .filter((r) => r.error)
      .map((r) => `${r.jurisdiction}: ${r.error}`);

    return {
      jurisdictions: results,
      totalNewPackages: totalNew,
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  @Post('cts/poll/:jurisdiction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger CTS inbox poll for a specific jurisdiction',
  })
  @ApiResponse({
    status: 200,
    description: 'Poll result for the specified jurisdiction',
  })
  async pollJurisdiction(@Param('jurisdiction') jurisdiction: string) {
    const result = await this.ctsPolling.pollSingleJurisdiction(jurisdiction);
    return {
      jurisdiction: result.jurisdiction,
      newPackages: result.newPackages,
      ...(result.error ? { errors: [result.error] } : {}),
    };
  }

  @Get('cts/poll/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get CTS polling status' })
  @ApiResponse({ status: 200, description: 'Current polling status' })
  async getPollStatus() {
    return {
      enabled: this.ctsPolling.isPollingEnabled(),
      jurisdictions: this.ctsPolling.getConfiguredJurisdictions(),
      lastPollTimestamp: this.ctsPolling.getLastPollTimestamp(),
      cronExpression:
        process.env.CTS_POLLING_INTERVAL_CRON || '0 */4 * * *',
    };
  }

  // ────────────────────────────────────────────
  // CTS Health Check Endpoints
  // ────────────────────────────────────────────

  @Get('cts/health/:jurisdiction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary: 'Test SFTP connectivity to a jurisdiction CTS endpoint',
  })
  @ApiResponse({ status: 200, description: 'Health check result' })
  async checkHealth(@Param('jurisdiction') jurisdiction: string) {
    const result = await this.sftpTransport.checkHealth(jurisdiction);
    return {
      jurisdiction: jurisdiction.toUpperCase(),
      reachable: result.reachable,
      latencyMs: result.latencyMs,
      ...(result.error ? { error: result.error } : {}),
    };
  }

  @Get('cts/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({
    summary:
      'Test SFTP connectivity to all configured jurisdiction CTS endpoints',
  })
  @ApiResponse({ status: 200, description: 'Health check results' })
  async checkAllHealth() {
    const jurisdictions = this.ctsPolling.getConfiguredJurisdictions();
    const results = await Promise.all(
      jurisdictions.map(async (jur) => {
        const result = await this.sftpTransport.checkHealth(jur);
        return {
          jurisdiction: jur,
          reachable: result.reachable,
          latencyMs: result.latencyMs,
          ...(result.error ? { error: result.error } : {}),
        };
      }),
    );
    return { jurisdictions: results };
  }
}
