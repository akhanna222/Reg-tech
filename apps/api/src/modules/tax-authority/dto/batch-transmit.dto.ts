import {
  IsArray,
  IsUUID,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchTransmitDto {
  @ApiProperty({
    description: 'Array of filing UUIDs to transmit',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  filingIds!: string[];

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 destination country code',
    example: 'GB',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2)
  destination!: string;
}
