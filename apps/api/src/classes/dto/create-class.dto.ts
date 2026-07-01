import { ApiProperty } from '@nestjs/swagger';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    example: 'd4197a05-f274-4484-75e9-9b580a1fb2fa',
    description: 'The UUID of the program associated with this class',
  })
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({
    example: 'a44faa86-2bec-1d9e-9962-9282afd10340',
    description: 'The UUID of the non-archived academic term',
  })
  @IsUUID()
  @IsNotEmpty()
  academicTermId: string;

  @ApiProperty({
    example: 'Section A',
    required: false,
    description:
      'Explicit section/class name (e.g. Section A). If not provided, it will be auto-generated.',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 40,
    description: 'The maximum student capacity for the class (must be >= 1)',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxCapacity: number;
}
