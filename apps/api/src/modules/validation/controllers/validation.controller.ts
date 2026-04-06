import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Put,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ValidationPipelineService } from '../services/validation-pipeline.service';
import { JurisdictionRule } from '../../database/entities/jurisdiction-rule.entity';

class CreateRuleDto {
  jurisdiction!: string;
  ruleName!: string;
  ruleDefinition!: Record<string, unknown>;
  effectiveFrom!: string;
  effectiveTo?: string;
}

class UpdateRuleDto {
  ruleDefinition?: Record<string, unknown>;
  effectiveTo?: string;
  isActive?: boolean;
}

@ApiTags('Validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('validation')
export class ValidationController {
  constructor(
    private readonly validationPipeline: ValidationPipelineService,
    @InjectRepository(JurisdictionRule)
    private readonly ruleRepository: Repository<JurisdictionRule>,
  ) {}

  @Post('trigger/:filingId')
  @Roles('TA_REVIEWER', 'TA_APPROVER', 'TA_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger validation pipeline for a filing' })
  @ApiResponse({ status: 202, description: 'Validation job queued' })
  async triggerValidation(
    @Param('filingId', ParseUUIDPipe) filingId: string,
  ) {
    return this.validationPipeline.triggerValidation(filingId);
  }

  @Get(':filingId/results')
  @ApiOperation({ summary: 'Get validation results for a filing' })
  @ApiResponse({ status: 200, description: 'Validation results by stage' })
  async getResults(@Param('filingId', ParseUUIDPipe) filingId: string) {
    return this.validationPipeline.getResults(filingId);
  }

  // --- Rules CRUD ---

  @Get('rules')
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'List all jurisdiction rules' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async listRules(
    @Query('jurisdiction') jurisdiction?: string,
    @Query('active') active?: boolean,
  ) {
    const where: Record<string, unknown> = {};
    if (jurisdiction) where.jurisdiction = jurisdiction.toUpperCase();
    if (active !== undefined) where.isActive = active;

    return this.ruleRepository.find({
      where,
      order: { jurisdiction: 'ASC', ruleName: 'ASC', version: 'DESC' },
    });
  }

  @Get('rules/:id')
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get a jurisdiction rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async getRule(@Param('id', ParseUUIDPipe) id: string) {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Rule not found: ${id}`);
    return rule;
  }

  @Post('rules')
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new jurisdiction rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  async createRule(
    @Body() dto: CreateRuleDto,
    @Query('createdBy') createdBy: string,
  ) {
    const rule = this.ruleRepository.create({
      jurisdiction: dto.jurisdiction.toUpperCase(),
      ruleName: dto.ruleName,
      ruleDefinition: dto.ruleDefinition,
      effectiveFrom: dto.effectiveFrom,
      effectiveTo: dto.effectiveTo ?? null,
      isActive: true,
      createdBy,
    });
    return this.ruleRepository.save(rule);
  }

  @Put('rules/:id')
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update a jurisdiction rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Rule not found: ${id}`);

    if (dto.ruleDefinition !== undefined) rule.ruleDefinition = dto.ruleDefinition;
    if (dto.effectiveTo !== undefined) rule.effectiveTo = dto.effectiveTo;
    if (dto.isActive !== undefined) rule.isActive = dto.isActive;

    return this.ruleRepository.save(rule);
  }

  @Delete('rules/:id')
  @Roles('TA_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a jurisdiction rule' })
  @ApiResponse({ status: 204, description: 'Rule deactivated' })
  async deleteRule(@Param('id', ParseUUIDPipe) id: string) {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException(`Rule not found: ${id}`);
    rule.isActive = false;
    await this.ruleRepository.save(rule);
  }
}
