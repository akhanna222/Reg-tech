import {
  Controller,
  Post,
  Body,
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
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SearchService, SearchFilters } from '../services/search.service';

class SearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  filingType?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  reportingPeriod?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

@ApiTags('Analytics - Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('search')
  @ApiOperation({ summary: 'Full-text search across filings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Body() dto: SearchDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: SearchFilters = {
      status: dto.status,
      filingType: dto.filingType,
      jurisdiction: dto.jurisdiction,
      reportingPeriod: dto.reportingPeriod,
      organizationId: dto.organizationId,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
    };

    return this.searchService.searchFilings(
      dto.query,
      filters,
      page ?? 1,
      limit ?? 20,
    );
  }
}
