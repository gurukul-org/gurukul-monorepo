import { ApiProperty } from '@nestjs/swagger';

export class TenantSettingsResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() subdomain: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() memberCount: number;
}
