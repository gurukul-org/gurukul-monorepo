import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateSavedFilterDto {
  @ApiProperty({ description: 'The custom name for the saved filter' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The feature code this filter belongs to' })
  @IsString()
  @IsNotEmpty()
  feature: string;

  @ApiProperty({ description: 'The applied filters represented as JSON' })
  @IsObject()
  @IsNotEmpty()
  filters: Record<string, any>;
}
