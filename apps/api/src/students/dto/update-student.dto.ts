import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

/**
 * Status changes go through the dedicated PATCH /students/:id/status endpoint.
 */
export class UpdateStudentDto {
  @ApiPropertyOptional({
    description: 'Unique roll number within the tenant.',
    example: 'STU-2026-001',
  })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9\-]+$/, {
    message: 'Only letters, digits, and hyphens are allowed.',
  })
  rollNumber?: string;

  @ApiPropertyOptional({
    description:
      'Update the linked tenant membership (portal account). ' +
      'Pass null to detach the portal account.',
    example: 'uuid-of-tenant-membership',
  })
  @IsUUID('4')
  @IsOptional()
  tenantMembershipId?: string | null;

  @ApiPropertyOptional({
    description: 'Admission date in ISO-8601 format.',
    example: '2026-07-01',
  })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;
}
