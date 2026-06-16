import { ApiPropertyOptional } from '@nestjs/swagger';

import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'The updated first name of the user.',
    minLength: 1,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return undefined;
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'The updated last name of the user.',
    minLength: 1,
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): string | undefined => {
    if (typeof value === 'string') {
      return value.trim();
    }

    return undefined;
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    nullable: true,
    description:
      'The updated phone number of the user. Pass null to clear the existing phone number.',
  })
  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.phone !== null)
  @IsString()
  phone?: string | null;
}
