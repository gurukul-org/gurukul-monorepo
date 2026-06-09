import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    example: 'd3b07384-d113-4ec6-a558-713be24921ef',
    description: 'The unique global user ID.',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The primary email address of the user.',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user.',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user.',
  })
  lastName: string;

  @ApiProperty({
    example: '+1234567890',
    nullable: true,
    description: 'The contact phone number of the user (nullable).',
  })
  phone: string | null;

  @ApiProperty({
    example: '2026-06-09T09:05:32.000Z',
    description: 'The timestamp when the user account was created.',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-06-09T09:05:32.000Z',
    description: 'The timestamp when the user account was last updated.',
  })
  updatedAt: Date;
}
