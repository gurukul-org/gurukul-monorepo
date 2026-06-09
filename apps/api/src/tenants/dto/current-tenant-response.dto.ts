import { ApiProperty } from '@nestjs/swagger';

export class CurrentTenantResponseDto {
  @ApiProperty({
    example: 'd3b07384-d113-4ec6-a558-713be24921ef',
    description: 'The unique tenant ID.',
  })
  id: string;

  @ApiProperty({
    example: 'my-school',
    description: 'The unique subdomain for the tenant.',
  })
  subdomain: string;

  @ApiProperty({
    example: 'My Awesome School',
    description: 'The display name of the tenant.',
  })
  name: string;

  @ApiProperty({
    example: 'SCHOOL',
    description: 'The type of the tenant.',
  })
  type: string;
}
