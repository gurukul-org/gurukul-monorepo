import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class InviteUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user to invite.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user.',
  })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user.',
  })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({
    example: ['role-id-1', 'role-id-2'],
    description: 'The IDs of the roles to assign to the user.',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role must be selected.' })
  @IsString({ each: true })
  roleIds: string[];

  @ApiPropertyOptional({
    description: 'Student roll number (optional at invite time).',
    example: 'STU-2026-001',
  })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Student admission date (optional at invite time).',
    example: '2026-07-01',
  })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @ApiPropertyOptional({
    description: 'Parent emergency contact phone (optional at invite time).',
    example: '+91 99999 99999',
  })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional({
    description: 'Pre-linked Parent profile IDs (for student invites).',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  preLinkedParentIds?: string[];

  @ApiPropertyOptional({
    description: 'Pre-linked Student profile IDs (for parent invites).',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  preLinkedStudentIds?: string[];
}
