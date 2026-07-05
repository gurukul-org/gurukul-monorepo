import { ApiProperty } from '@nestjs/swagger';

import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ENROLMENT_STATUSES = ['ACTIVE', 'WITHDRAWN', 'COMPLETED'] as const;
export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number];

export class UpdateEnrolmentDto {
  @ApiProperty({
    enum: ENROLMENT_STATUSES,
    description: 'New enrolment status',
  })
  @IsIn(ENROLMENT_STATUSES)
  @IsOptional()
  status?: EnrolmentStatus;

  @ApiProperty({
    required: false,
    description: 'Optional reason for withdrawal',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  withdrawReason?: string;
}
