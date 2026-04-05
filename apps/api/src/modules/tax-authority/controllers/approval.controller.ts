import {
  Controller,
  Post,
  Param,
  Body,
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
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import { ApprovalTargetType } from '../../database/entities/approval-action.entity';

class ApprovalDto {
  comments?: string;
}

@ApiTags('Tax Authority - Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TA_APPROVER')
@Controller('ta')
export class ApprovalController {
  constructor(
    private readonly approvalWorkflow: ApprovalWorkflowService,
  ) {}

  @Post('submissions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a filing submission' })
  @ApiResponse({ status: 200, description: 'Filing approved' })
  @ApiResponse({ status: 400, description: 'Invalid filing status for approval' })
  @ApiResponse({ status: 404, description: 'Filing not found' })
  async approveSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalWorkflow.approve(
      ApprovalTargetType.FILING,
      id,
      req.user.id,
      dto.comments,
    );
  }

  @Post('submissions/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a filing submission' })
  @ApiResponse({ status: 200, description: 'Filing rejected' })
  @ApiResponse({ status: 400, description: 'Invalid filing status for rejection' })
  @ApiResponse({ status: 404, description: 'Filing not found' })
  async rejectSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalWorkflow.reject(
      ApprovalTargetType.FILING,
      id,
      req.user.id,
      dto.comments,
    );
  }

  @Post('enrolments/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve an FI enrolment' })
  @ApiResponse({ status: 200, description: 'Enrolment approved' })
  @ApiResponse({ status: 400, description: 'Invalid enrolment status' })
  @ApiResponse({ status: 404, description: 'Enrolment not found' })
  async approveEnrolment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalWorkflow.approve(
      ApprovalTargetType.ENROLMENT,
      id,
      req.user.id,
      dto.comments,
    );
  }

  @Post('enrolments/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an FI enrolment' })
  @ApiResponse({ status: 200, description: 'Enrolment rejected' })
  @ApiResponse({ status: 400, description: 'Invalid enrolment status' })
  @ApiResponse({ status: 404, description: 'Enrolment not found' })
  async rejectEnrolment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.approvalWorkflow.reject(
      ApprovalTargetType.ENROLMENT,
      id,
      req.user.id,
      dto.comments,
    );
  }
}
