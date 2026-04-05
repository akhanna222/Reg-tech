import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  SubmissionBrowserService,
  SubmissionFilters,
} from '../services/submission-browser.service';
import { FilingStatus } from '../../database/entities/filing.entity';

@ApiTags('Tax Authority - Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TA_REVIEWER', 'TA_APPROVER', 'TA_ADMIN')
@Controller('ta/submissions')
export class SubmissionBrowserController {
  constructor(
    private readonly submissionBrowserService: SubmissionBrowserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List submitted filings with filtering and pagination' })
  @ApiQuery({ name: 'status', required: false, enum: FilingStatus })
  @ApiQuery({ name: 'jurisdiction', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'filingType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Paginated list of submissions' })
  async listSubmissions(
    @Query('status') status?: FilingStatus,
    @Query('jurisdiction') jurisdiction?: string,
    @Query('organizationId') organizationId?: string,
    @Query('filingType') filingType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters: SubmissionFilters = {
      status,
      jurisdiction,
      organizationId,
      filingType,
      dateFrom,
      dateTo,
    };

    return this.submissionBrowserService.findAll(filters, {
      page: page ?? 1,
      limit: limit ?? 20,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get submission details' })
  @ApiResponse({ status: 200, description: 'Submission details with relations' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async getSubmission(@Param('id', ParseUUIDPipe) id: string) {
    return this.submissionBrowserService.findOne(id);
  }
}
