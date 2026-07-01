import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({
    example: '9th Grade Program',
    description: 'The name of the program (2-120 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'GRADE-9',
    description: 'Unique program code (1-20 chars, alphanumeric + hyphen)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Code must be alphanumeric and can contain hyphens only.',
  })
  code: string;

  @ApiProperty({
    example: 'Curriculum structure for 9th Grade students.',
    required: false,
    description: 'Program description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
