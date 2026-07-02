import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class BulkCreateEnrolmentDto {
  @ApiProperty({
    example: 'b2c3d4e5-...',
    description: 'UUID of the class to enrol students into',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    example: ['a1b2c3d4-...', 'c3d4e5f6-...'],
    description: 'Array of student profile UUIDs to enrol',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  studentProfileIds: string[];

  @ApiProperty({
    example: '2026-07-01T00:00:00.000Z',
    required: false,
    description: 'Enrolment date — defaults to now if omitted',
  })
  @IsDateString()
  @IsOptional()
  enrolledAt?: string;
}
