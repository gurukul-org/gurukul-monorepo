import { ApiProperty } from '@nestjs/swagger';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: 'program-uuid-here',
    description: 'The UUID of the academic program associated with this course',
  })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({
    example: 'Mathematics',
    description: 'The name of the course',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'MATH101',
    description: 'The unique course code (within the tenant)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Introductory course in algebra and calculus',
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
