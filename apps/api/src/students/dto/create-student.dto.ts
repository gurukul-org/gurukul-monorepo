import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiPropertyOptional({
    description:
      'The tenant membership ID of an existing active member with the Student role. ' +
      'Omit if the student does not yet have a portal account.',
    example: 'uuid-of-tenant-membership',
  })
  @IsUUID('4')
  @IsOptional()
  tenantMembershipId?: string;

  @ApiProperty({
    description:
      'Unique roll number for this student within the tenant. ' +
      'Alphanumeric and hyphens only, max 50 chars.',
    example: 'STU-2026-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\-]+$/, {
    message:
      'Roll number may only contain letters, digits, and hyphens.',
  })
  rollNumber: string;

  @ApiPropertyOptional({
    description:
      'Admission date in ISO-8601 format. Defaults to today if omitted.',
    example: '2026-07-01',
  })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;
}
