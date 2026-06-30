import { ApiProperty } from '@nestjs/swagger';

import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ChangeMemberRolesDto {
  @ApiProperty({
    type: [String],
    description: 'The complete set of role ids to assign to the member.',
    example: ['3f1a6c2e-0b2d-4c9a-9b7e-1a2b3c4d5e6f'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role must be assigned.' })
  @IsUUID('all', { each: true })
  roleIds: string[];
}
