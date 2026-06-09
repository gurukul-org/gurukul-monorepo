import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the user account.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
