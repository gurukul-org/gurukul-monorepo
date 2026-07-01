import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProgramDto {
  @ApiProperty({
    example: '9th Grade Program (Revised)',
    required: false,
    description: 'The name of the program (2-120 chars)',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiProperty({
    example: 'GRADE-9R',
    required: false,
    description: 'Unique program code (1-20 chars, alphanumeric + hyphen)',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Code must be alphanumeric and can contain hyphens only.',
  })
  code?: string;

  @ApiProperty({
    example: 'Revised 9th grade curriculum.',
    required: false,
    description: 'Program description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Bypass any warnings (such as changing code with courses referencing it)',
  })
  @IsBoolean()
  @IsOptional()
  ignoreWarnings?: boolean;
}
