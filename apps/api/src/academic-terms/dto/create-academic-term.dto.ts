import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAcademicTermDto {
  @ApiProperty({
    example: 'Fall 2026',
    description: 'The name of the academic term (2-60 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Start date of the term',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2026-12-20T00:00:00.000Z',
    description: 'End date of the term',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Bypass any non-blocking warnings (such as date overlaps)',
  })
  @IsBoolean()
  @IsOptional()
  ignoreWarnings?: boolean;
}
