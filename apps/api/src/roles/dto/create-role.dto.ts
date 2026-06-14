import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Lab Instructor',
    description: 'Unique role name within the tenant',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Can manage lab sessions and equipment',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 7,
    description:
      'Rank determines role hierarchy; lower numbers = higher privilege. Must be higher than your own highest role rank.',
  })
  @IsInt()
  @Min(1)
  rank: number;

  @ApiProperty({
    example: ['view-students', 'view-own-dashboard', 'view-attendance'],
    description:
      'Permission IDs from the @repo/permissions registry to assign to this role',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  permissions: string[];
}
