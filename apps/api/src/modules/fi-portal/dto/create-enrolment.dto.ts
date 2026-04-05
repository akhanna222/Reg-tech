import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EnrolmentType {
  CRS = 'CRS',
  FATCA = 'FATCA',
  BOTH = 'BOTH',
}

export class CreateEnrolmentDto {
  @ApiProperty({ description: 'Legal name of the financial institution' })
  @IsString()
  @IsNotEmpty()
  institutionName!: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 jurisdiction code', example: 'GB' })
  @IsString()
  @Length(2, 2)
  jurisdiction!: string;

  @ApiPropertyOptional({ description: 'Global Intermediary Identification Number', example: 'A1B2C3.00000.LE.826' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6}\.\d{5}\.[A-Z]{2}\.\d{3}$/, {
    message: 'GIIN must match format: XXXXXX.XXXXX.XX.XXX',
  })
  giin?: string;

  @ApiProperty({ enum: EnrolmentType, description: 'Reporting regime(s) to enrol for' })
  @IsEnum(EnrolmentType)
  enrolmentType!: EnrolmentType;

  @ApiProperty({ description: 'Primary contact email for enrolment correspondence' })
  @IsString()
  @IsNotEmpty()
  contactEmail!: string;

  @ApiPropertyOptional({ description: 'Primary contact phone number' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Additional notes or supporting information' })
  @IsOptional()
  @IsString()
  notes?: string;
}
