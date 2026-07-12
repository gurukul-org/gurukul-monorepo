import { ApiProperty } from '@nestjs/swagger';

import { IsIn, IsNumber, IsString, Max, Min } from 'class-validator';

// Keep these lists in sync with the frontend theme registry
// (apps/web/lib/theme/theme-config.ts — PRESET_IDS and FONT_IDS).
export const THEME_PRESETS = [
  'default',
  'zinc',
  'blue',
  'rose',
  'green',
  'violet',
  'orange',
  'cyan',
  'aubergine',
] as const;

export const THEME_FONTS = [
  'oxanium',
  'inter',
  'roboto',
  'poppins',
  'open-sans',
  'lato',
  'montserrat',
  'nunito',
  'raleway',
  'work-sans',
  'source-sans',
  'merriweather',
  'playfair',
  'times',
  'sans-serif',
] as const;

export const THEME_SIZES = ['sm', 'md', 'lg'] as const;

export class UpdateTenantThemeDto {
  @ApiProperty({ enum: THEME_PRESETS, example: 'blue' })
  @IsString()
  @IsIn(THEME_PRESETS)
  preset: string;

  @ApiProperty({ example: 0.5, minimum: 0, maximum: 2 })
  @IsNumber()
  @Min(0)
  @Max(2)
  radius: number;

  @ApiProperty({ enum: THEME_FONTS, example: 'inter' })
  @IsString()
  @IsIn(THEME_FONTS)
  font: string;

  @ApiProperty({ enum: THEME_SIZES, example: 'md' })
  @IsString()
  @IsIn(THEME_SIZES)
  size: string;
}

export class TenantThemeResponseDto {
  @ApiProperty({
    type: UpdateTenantThemeDto,
    nullable: true,
    description: 'The stored theme, or null when the tenant has no theme set.',
  })
  theme: UpdateTenantThemeDto | null;
}
