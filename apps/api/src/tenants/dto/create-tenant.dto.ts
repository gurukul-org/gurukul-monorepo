import { ApiProperty } from '@nestjs/swagger';

import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

import { SUBDOMAIN_REGEX } from '../tenants.constants';

const TENANT_TYPES = ['SCHOOL', 'INSTITUTE', 'COACHING'] as const;
export type TenantType = (typeof TENANT_TYPES)[number];

export class CreateTenantDto {
  @ApiProperty({
    example: 'my-school',
    description: 'The unique subdomain for the tenant.',
  })
  @IsString()
  @Matches(SUBDOMAIN_REGEX, {
    message:
      'Subdomain must be 3-63 chars, lowercase letters, digits, or hyphens, and not start or end with a hyphen.',
  })
  subdomain: string;

  @ApiProperty({
    example: 'My Awesome School',
    description: 'The display name of the tenant.',
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    example: 'SCHOOL',
    enum: TENANT_TYPES,
    description: 'The type of the tenant.',
  })
  @IsString()
  @IsIn(TENANT_TYPES)
  type: TenantType;

  @ApiProperty({
    example: '123 Main St',
    description: 'Tenant physical address.',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City where the tenant is located.',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'New York',
    description: 'State/Province where the tenant is located.',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country where the tenant is located.',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: '10001',
    description: 'Zip/Postal code.',
    required: false,
  })
  @IsOptional()
  @IsString()
  zipCode?: string;
}
