import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
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
}
