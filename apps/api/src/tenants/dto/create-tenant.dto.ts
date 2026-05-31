import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

import { SUBDOMAIN_REGEX } from '../tenants.constants';

const TENANT_TYPES = ['SCHOOL', 'INSTITUTE', 'COACHING'] as const;
export type TenantType = (typeof TENANT_TYPES)[number];

export class CreateTenantDto {
  @IsString()
  @Matches(SUBDOMAIN_REGEX, {
    message:
      'Subdomain must be 3-63 chars, lowercase letters, digits, or hyphens, and not start or end with a hyphen.',
  })
  subdomain: string;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsIn(TENANT_TYPES)
  type: TenantType;

  // Owner credentials — required only when the caller is anonymous.
  // The controller enforces conditional presence; class-validator marks them optional.
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
