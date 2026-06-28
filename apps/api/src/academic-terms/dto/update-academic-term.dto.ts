import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAcademicTermDto {
  @ApiProperty({
    example: 'Fall 2026 (Revised)',
    required: false,
    description: 'The name of the academic term (2-60 chars)',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    required: false,
    description: 'Start date of the term',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    example: '2026-12-20T00:00:00.000Z',
    required: false,
    description: 'End date of the term',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Bypass any non-blocking warnings (such as classes scheduled or date overlaps)',
  })
  @IsBoolean()
  @IsOptional()
  ignoreWarnings?: boolean;
}
