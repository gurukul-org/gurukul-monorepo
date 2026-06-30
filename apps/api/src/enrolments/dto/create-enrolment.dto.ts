import { ApiProperty } from '@nestjs/swagger';

import {
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateEnrolmentDto {
  @ApiProperty({
    example: 'a1b2c3d4-...',
    description: 'UUID of the student profile to enrol',
  })
  @IsUUID()
  @IsNotEmpty()
  studentProfileId: string;

  @ApiProperty({
    example: 'b2c3d4e5-...',
    description: 'UUID of the class to enrol into',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    example: '2026-07-01T00:00:00.000Z',
    required: false,
    description: 'Enrolment date — defaults to now if omitted',
  })
  @IsDateString()
  @IsNotEmpty()
  enrolledAt?: string;
}
