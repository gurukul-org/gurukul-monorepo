import { ApiProperty } from '@nestjs/swagger';

import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class LinkParentDto {
  @ApiProperty({
    example: 'a1b2c3d4-...',
    description: 'UUID of the parent profile to link',
  })
  @IsUUID()
  @IsNotEmpty()
  parentProfileId: string;

  @ApiProperty({
    example: 'MOTHER',
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
    description: 'Relationship of the parent to the student',
  })
  @IsIn(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'])
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    example: 'Aunt',
    required: false,
    description:
      'Description of the relationship (recommended/required if relationship is OTHER)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  relationshipDescription?: string;
}
