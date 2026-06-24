import { ApiProperty } from '@nestjs/swagger';

import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RoleSwap {
  @ApiProperty({
    description: 'The role ID to remove.',
    example: 'uuid-of-hod-role',
  })
  @IsUUID('4')
  removeRoleId: string;

  @ApiProperty({
    description: 'The role ID to add in its place.',
    example: 'uuid-of-faculty-role',
  })
  @IsUUID('4')
  addRoleId: string;
}

export class ReplaceRolesDto {
  @ApiProperty({
    description:
      'An array of role swap pairs. Each pair removes one role and adds another atomically.',
    type: [RoleSwap],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((swap: RoleSwap) => `${swap.removeRoleId}:${swap.addRoleId}`)
  @ValidateNested({ each: true })
  @Type(() => RoleSwap)
  swaps: RoleSwap[];
}
