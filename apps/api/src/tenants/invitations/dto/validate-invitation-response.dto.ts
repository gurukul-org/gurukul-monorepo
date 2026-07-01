import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateInvitationResponseDto {
  @ApiProperty({
    example: 'School A',
    description: 'The name of the tenant the user is invited to.',
  })
  tenantName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address the invitation was sent to.',
  })
  email: string;

  @ApiProperty({
    example: ['Teacher', 'Attendance Manager'],
    description: 'The names of the roles assigned in the invitation.',
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    example: true,
    description:
      'Whether the user needs to set a password to complete acceptance.',
  })
  requiresPasswordSetup: boolean;

  @ApiPropertyOptional({
    description: 'Pre-filled roll number for students.',
    example: 'STU-2026-001',
  })
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Pre-filled admission date for students.',
    example: '2026-07-01',
  })
  admissionDate?: string;

  @ApiPropertyOptional({
    description: 'Pre-filled emergency contact phone for parents.',
    example: '+91 99999 99999',
  })
  emergencyPhone?: string;

  @ApiPropertyOptional({
    description: 'Count of pre-linked parent records.',
    example: 2,
  })
  preLinkedParentCount?: number;

  @ApiPropertyOptional({
    description: 'Count of pre-linked student records.',
    example: 1,
  })
  preLinkedStudentCount?: number;
}
