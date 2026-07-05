import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateParentDto {
  @ApiPropertyOptional({
    description: 'ID of the user membership in this tenant portal.',
    example: 'uuid-of-membership',
  })
  @IsUUID('4')
  @IsOptional()
  tenantMembershipId?: string;

  @ApiProperty({
    description: 'Emergency contact phone number.',
    example: '+91 99999 99999',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^\+?[0-9\s\-]+$/, {
    message:
      'Emergency phone can only contain digits, spaces, and hyphens, and optionally start with +.',
  })
  emergencyPhone: string;
}
