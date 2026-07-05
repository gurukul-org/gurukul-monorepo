import { ApiProperty } from '@nestjs/swagger';

import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateParentLinkDto {
  @ApiProperty({
    example: 'GUARDIAN',
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
    description: 'Relationship of the parent to the student',
  })
  @IsIn(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'])
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    example: 'Uncle',
    required: false,
    description:
      'Description of the relationship (recommended/required if relationship is OTHER)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  relationshipDescription?: string;
}
