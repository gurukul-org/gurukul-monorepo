import { ApiProperty } from '@nestjs/swagger';

import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class RemoveRolesDto {
  @ApiProperty({
    description: 'One or more role IDs to remove from the member.',
    type: [String],
    example: ['uuid-of-hod-role'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
