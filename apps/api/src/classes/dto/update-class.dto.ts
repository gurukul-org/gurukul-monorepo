import { ApiProperty } from '@nestjs/swagger';

import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateClassDto {
  @ApiProperty({
    example: 'Class #2 (Advanced Section)',
    required: false,
    description: 'The name of the class',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 40,
    required: false,
    description:
      'The maximum capacity (must be >= 1 and >= current active enrollment count)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @ApiProperty({
    example: 'ACTIVE',
    required: false,
    enum: ['ACTIVE', 'ARCHIVED'],
    description: 'Status of the class (ACTIVE or ARCHIVED)',
  })
  @IsString()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: ['b55faa86-2bec-1d9e-9962-9282afd10341'],
    required: false,
    type: [String],
    description: 'Optional list of assigned instructor tenant membership IDs',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  instructorIds?: string[];

  @ApiProperty({
    example: 'b55faa86-2bec-1d9e-9962-9282afd10341',
    required: false,
    description: 'Optional tenant membership ID of primary instructor',
  })
  @IsUUID()
  @IsOptional()
  primaryInstructorId?: string;
}
