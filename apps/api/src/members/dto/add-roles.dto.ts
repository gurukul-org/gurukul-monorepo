import { ApiProperty } from '@nestjs/swagger';

import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AddRolesDto {
  @ApiProperty({
    description: 'One or more role IDs to assign to the member.',
    type: [String],
    example: ['uuid-of-faculty-role', 'uuid-of-hod-role'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
