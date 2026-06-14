import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Whether the user needs to set a password to complete acceptance.',
  })
  requiresPasswordSetup: boolean;
}
