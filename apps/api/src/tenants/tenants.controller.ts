import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { PERMS } from '@repo/permissions';

import {
  GetCurrentTenant,
  GetCurrentUserId,
  Public,
  RequirePermissions,
  SkipTenantCheck,
} from '../common/decorators';
import {
  AccessTokenResponseDto,
  ConflictErrorResponseDto,
  NotFoundErrorResponseDto,
  TenantValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '../common/dto';
import { setRefreshTokenCookie } from '../users/cookies.util';
import {
  CreateTenantDto,
  CurrentTenantResponseDto,
  TenantSettingsResponseDto,
  TenantThemeResponseDto,
  UpdateTenantDto,
  UpdateTenantThemeDto,
} from './dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get current tenant details',
    description:
      'Resolves and returns the active tenant details matching the request hostname (subdomain). Requires the caller to be an authenticated member of the resolved tenant — enforced by the global TenantGuard. Returns 404 on the apex domain or for unknown/inactive subdomains; 401 when no access token is provided; 403 when the user is not a member of this tenant.',
  })
  @ApiOkResponse({
    type: CurrentTenantResponseDto,
    description: 'Active tenant resolved successfully.',
  })
  @ApiNotFoundResponse({
    type: NotFoundErrorResponseDto,
    description:
      'Workspace not found (subdomain not registered or soft-deleted).',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  getCurrent(@Req() req: Request): CurrentTenantResponseDto {
    if (!req.tenant) {
      throw new NotFoundException('Workspace not found');
    }
    const { id, subdomain, name, type } = req.tenant;
    return { id, subdomain, name, type };
  }

  @Get('current/settings')
  @RequirePermissions(PERMS.tenant.view)
  @ApiOperation({ summary: 'Get workspace settings' })
  @ApiOkResponse({
    type: TenantSettingsResponseDto,
    description: 'Workspace settings retrieved successfully.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async getSettings(
    @GetCurrentTenant('id') tenantId: string,
  ): Promise<TenantSettingsResponseDto> {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.tenantsService.getTenantSettings(tenantId);
  }

  @Patch('current')
  @RequirePermissions(PERMS.tenant.edit)
  @ApiOperation({ summary: 'Rename workspace' })
  @ApiOkResponse({
    type: TenantSettingsResponseDto,
    description: 'Workspace renamed successfully.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async updateTenant(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentTenant('subdomain') subdomain: string,
    @GetCurrentUserId() actorUserId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantSettingsResponseDto> {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.tenantsService.updateTenant(
      tenantId,
      subdomain,
      actorUserId,
      dto,
    );
  }

  @Get('current/theme')
  @RequirePermissions(PERMS.tenant.view)
  @ApiOperation({ summary: 'Get the current workspace theme' })
  @ApiOkResponse({
    type: TenantThemeResponseDto,
    description: 'Workspace theme retrieved successfully.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async getTheme(
    @GetCurrentTenant('id') tenantId: string,
  ): Promise<TenantThemeResponseDto> {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return { theme: await this.tenantsService.getTenantTheme(tenantId) };
  }

  @Patch('current/theme')
  @RequirePermissions(PERMS.tenant.edit)
  @ApiOperation({
    summary: 'Update the workspace theme',
    description:
      'Sets the tenant-scoped theme (preset, radius, font). Owner-only, enforced by the required tenant edit permission.',
  })
  @ApiOkResponse({
    type: TenantThemeResponseDto,
    description: 'Workspace theme updated successfully.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async updateTheme(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentTenant('subdomain') subdomain: string,
    @GetCurrentUserId() actorUserId: string,
    @Body() dto: UpdateTenantThemeDto,
  ): Promise<TenantThemeResponseDto> {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return {
      theme: await this.tenantsService.updateTenantTheme(
        tenantId,
        subdomain,
        actorUserId,
        dto,
      ),
    };
  }

  @Public()
  @SkipTenantCheck()
  @Get('theme')
  @ApiOperation({
    summary: 'Public: resolve the theme for the request subdomain',
    description:
      'Unauthenticated read of the tenant theme for the resolved subdomain, used for no-flash server-side injection. Returns { theme: null } on the apex domain or when no theme is set.',
  })
  @ApiOkResponse({
    type: TenantThemeResponseDto,
    description: 'Theme for the resolved subdomain (null when unset).',
  })
  async getPublicTheme(@Req() req: Request): Promise<TenantThemeResponseDto> {
    if (!req.tenant) return { theme: null };
    return { theme: await this.tenantsService.getTenantTheme(req.tenant.id) };
  }

  @SkipTenantCheck()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new tenant',
    description:
      'Creates a new tenant/workspace. The authenticated user becomes the owner. Requires a valid access token. Returns an access token and sets the refresh token cookie.',
  })
  @ApiCreatedResponse({
    type: AccessTokenResponseDto,
    description:
      'Tenant created successfully. Access token returned in response body, and refresh token set in cookies.',
  })
  @ApiBadRequestResponse({
    type: TenantValidationErrorResponseDto,
    description: 'Invalid subdomain format or validation constraints failed.',
  })
  @ApiConflictResponse({
    type: ConflictErrorResponseDto,
    description: 'Subdomain is reserved or subdomain is already in use.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  async createTenant(
    @Body() dto: CreateTenantDto,
    @GetCurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const tokens = await this.tenantsService.createTenant(dto, userId);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }
}
