import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DashboardService } from '../services/dashboard.service';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';
import { CrossJurisdictionService } from '../services/cross-jurisdiction.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TA_REVIEWER', 'TA_APPROVER', 'TA_ADMIN', 'SYSTEM_ADMIN')
@Controller('analytics')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly anomalyDetection: AnomalyDetectionService,
    private readonly crossJurisdiction: CrossJurisdictionService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiQuery({ name: 'jurisdiction', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  async getDashboardMetrics(
    @Query('jurisdiction') jurisdiction?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const dateRange =
      dateFrom || dateTo ? { from: dateFrom ?? '', to: dateTo ?? '' } : undefined;
    return this.dashboardService.getDashboardMetrics(jurisdiction, dateRange);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get country comparison data' })
  @ApiQuery({
    name: 'countries',
    required: true,
    description: 'Comma-separated list of ISO country codes',
    example: 'GB,US,DE',
  })
  @ApiQuery({ name: 'reportingPeriod', required: false })
  @ApiResponse({ status: 200, description: 'Jurisdiction comparison data' })
  async getCountryComparison(
    @Query('countries') countriesStr: string,
    @Query('reportingPeriod') reportingPeriod?: string,
  ) {
    const countries = countriesStr.split(',').map((c) => c.trim());

    if (reportingPeriod) {
      return this.crossJurisdiction.compareJurisdictions(countries, reportingPeriod);
    }

    return this.dashboardService.getCountryComparison(countries);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get anomaly detection alerts' })
  @ApiQuery({ name: 'jurisdiction', required: false })
  @ApiResponse({ status: 200, description: 'Prioritized anomaly alerts' })
  async getAnomalies(@Query('jurisdiction') jurisdiction?: string) {
    return this.anomalyDetection.detectAnomalies(jurisdiction);
  }
}
