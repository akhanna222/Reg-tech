import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadXmlDto {
  @ApiProperty({ description: 'MIME content type of the uploaded file' })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({ description: 'Optional description of the uploaded document' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadXmlResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  storageKey!: string;

  @ApiProperty()
  fileHash!: string;

  @ApiProperty()
  fileSize!: number;
}
