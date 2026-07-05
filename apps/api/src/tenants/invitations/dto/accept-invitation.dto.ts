import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    example: 'token-string',
    description: 'The secure invitation token received via email.',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newpassword123',
    description:
      'The password to set if this is a newly created placeholder user.',
    required: false,
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'Student roll number required on student accept.',
    example: 'STU-2026-001',
  })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Student admission date required on student accept.',
    example: '2026-07-01',
  })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @ApiPropertyOptional({
    description: 'Parent emergency contact phone required on parent accept.',
    example: '+91 99999 99999',
  })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;
}
