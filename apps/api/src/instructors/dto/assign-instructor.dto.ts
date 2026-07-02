import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
}
