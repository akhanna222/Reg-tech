import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EnrolmentService } from '../services/enrolment.service';
import { CreateEnrolmentDto } from '../dto/create-enrolment.dto';

@ApiTags('FI Portal - Enrolment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fi')
export class EnrolmentController {
  constructor(private readonly enrolmentService: EnrolmentService) {}

  @Post('enrol')
  @Roles('FI_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new FI enrolment application' })
  @ApiResponse({ status: 201, description: 'Enrolment submitted successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate GIIN enrolment' })
  async submitEnrolment(
    @Body() dto: CreateEnrolmentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.enrolmentService.createEnrolment(dto, req.user.id);
  }

  @Get('enrolment/:id/status')
  @Roles('FI_ADMIN')
  @ApiOperation({ summary: 'Get enrolment status by organization ID' })
  @ApiResponse({ status: 200, description: 'Enrolment status returned' })
  @ApiResponse({ status: 404, description: 'Enrolment not found' })
  async getEnrolmentStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrolmentService.getEnrolmentStatus(id);
  }
}
