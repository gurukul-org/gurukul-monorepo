import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({
    example: 'Mathematics II',
    required: false,
    description: 'The name of the course',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'MATH102',
    required: false,
    description: 'The unique course code (within the tenant)',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: 'Advanced course in calculus',
    required: false,
    description: 'Detailed description of the course',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 4,
    required: false,
    description: 'Number of academic credits for this course (must be >= 1)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  credits?: number;
}
