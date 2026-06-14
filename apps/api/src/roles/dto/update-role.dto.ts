import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Lab Instructor',
    description: 'New name for the role',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'Updated description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 7,
    description: 'New rank for the role',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rank?: number;

  @ApiProperty({
    example: ['view-students', 'view-own-dashboard'],
    description:
      'Full replacement set of permission IDs. All previous permissions are removed and replaced with this set.',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  permissions?: string[];
}
