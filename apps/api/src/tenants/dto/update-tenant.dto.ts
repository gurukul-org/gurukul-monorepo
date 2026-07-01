import { ApiProperty } from '@nestjs/swagger';

import { IsString, Length } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Greenwood Academy', minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  name: string;
}
