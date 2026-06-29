import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ALL_STUDENT_STATUSES } from '../students.constants';

export class ChangeStudentStatusDto {
  @ApiProperty({
    description: 'Target status to transition the student to.',
    enum: ALL_STUDENT_STATUSES,
    example: 'SUSPENDED',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALL_STUDENT_STATUSES, {
    message: `status must be one of: ${ALL_STUDENT_STATUSES.join(', ')}`,
  })
  status: string;

  @ApiPropertyOptional({
    description:
      'Set to true to acknowledge the active-enrolment warning and proceed anyway. ' +
      'Required when the student has active enrolments and the target status is GRADUATED or INACTIVE.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  ignoreWarnings?: boolean;
}
