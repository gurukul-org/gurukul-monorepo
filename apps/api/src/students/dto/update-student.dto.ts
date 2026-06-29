import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * Roll number and status are intentionally excluded:
 *   - Roll number is immutable after creation.
 *   - Status changes go through the dedicated PATCH /students/:id/status endpoint.
 */
export class UpdateStudentDto {
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
