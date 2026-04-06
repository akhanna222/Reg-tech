import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FilingType } from '../../database/entities/filing.entity';

export class CreateFilingDto {
  @ApiProperty({ description: 'Reporting period (year)', example: '2025' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Reporting period must be a 4-digit year' })
  reportingPeriod!: string;

  @ApiProperty({ enum: FilingType, description: 'Filing type: CRS or FATCA' })
  @IsEnum(FilingType)
  filingType!: FilingType;

  @ApiPropertyOptional({ description: 'Internal reference or label for this filing' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class UpdateFilingDto {
  @ApiPropertyOptional({ description: 'Reporting period (year)', example: '2025' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Reporting period must be a 4-digit year' })
  reportingPeriod?: string;

  @ApiPropertyOptional({ description: 'Internal reference or label for this filing' })
  @IsOptional()
  @IsString()
  reference?: string;
}
