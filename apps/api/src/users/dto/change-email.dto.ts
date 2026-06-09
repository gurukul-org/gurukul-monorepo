import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({
    example: 'new-email@example.com',
    description: 'The new email address to assign to this account.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'currentPassword123',
    description: "The user's current password for identity verification.",
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}
