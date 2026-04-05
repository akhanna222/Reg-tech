import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FilingService, FilingFilters } from '../services/filing.service';
import { XmlUploadService } from '../services/xml-upload.service';
import { CreateFilingDto, UpdateFilingDto } from '../dto/create-filing.dto';
import { FilingStatus } from '../../database/entities/filing.entity';

interface AuthenticatedRequest {
  user: {
    id: string;
    organizationId: string;
  };
}

@ApiTags('FI Portal - Filings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FI_USER', 'FI_ADMIN')
@Controller('fi/filings')
export class FilingController {
  constructor(
    private readonly filingService: FilingService,
    private readonly xmlUploadService: XmlUploadService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new filing draft' })
  @ApiResponse({ status: 201, description: 'Filing created' })
  async createFiling(
    @Body() dto: CreateFilingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.filingService.createFiling(dto, req.user.organizationId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
      fileFilter: (_req: any, file: any, cb: any) => {
        if (
          file.mimetype === 'application/xml' ||
          file.mimetype === 'text/xml' ||
          file.originalname.endsWith('.xml')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only XML files are allowed'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload XML document for a filing' })
  @ApiResponse({ status: 201, description: 'XML uploaded successfully' })
  async uploadXml(
    @UploadedFile() file: Express.Multer.File,
    @Query('filingId', ParseUUIDPipe) filingId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.xmlUploadService.uploadXml(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      filingId,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List filings for the authenticated organization' })
  @ApiQuery({ name: 'status', required: false, enum: FilingStatus })
  @ApiQuery({ name: 'filingType', required: false })
  @ApiQuery({ name: 'reportingPeriod', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of filings' })
  async listFilings(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: FilingStatus,
    @Query('filingType') filingType?: string,
    @Query('reportingPeriod') reportingPeriod?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: FilingFilters = {
      status,
      filingType,
      reportingPeriod,
      page,
      limit,
    };
    return this.filingService.listFilings(req.user.organizationId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get filing details' })
  @ApiResponse({ status: 200, description: 'Filing details returned' })
  @ApiResponse({ status: 404, description: 'Filing not found' })
  async getFiling(@Param('id', ParseUUIDPipe) id: string) {
    return this.filingService.getFiling(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a draft filing' })
  @ApiResponse({ status: 200, description: 'Filing updated' })
  @ApiResponse({ status: 400, description: 'Filing is not in DRAFT status' })
  async updateFiling(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFilingDto,
  ) {
    return this.filingService.updateFiling(id, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit filing for validation' })
  @ApiResponse({ status: 200, description: 'Filing submitted, validation queued' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async submitFiling(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.filingService.submitFiling(id, req.user.id);
  }
}
