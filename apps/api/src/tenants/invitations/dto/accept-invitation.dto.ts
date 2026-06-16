import { ApiProperty } from '@nestjs/swagger';

import { IsOptional, IsString, MinLength } from 'class-validator';

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
}
