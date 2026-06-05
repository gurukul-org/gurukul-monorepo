import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.phone !== null)
  @IsString()
  phone?: string | null;
}
