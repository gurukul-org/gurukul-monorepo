import { ApiProperty } from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class AssignInstructorDto {
  @ApiProperty({
    example: 'a1b2c3d4-...',
    description: 'UUID of the eligible tenant member profile to assign',
  })
  @IsUUID()
  @IsNotEmpty()
  tenantMembershipId: string;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Whether this instructor is the primary instructor for the class',
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({
    example: ['b55faa86-2bec-1d9e-9962-9282afd10341'],
    required: false,
    type: [String],
    description:
      'Course IDs (from the class program) this instructor teaches in this class',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  courseIds?: string[];
}
