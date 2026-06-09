import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { Public, SkipTenantCheck } from '../common/decorators';
import {
  AccessTokenResponseDto,
  ConflictErrorResponseDto,
  NotFoundErrorResponseDto,
  TenantValidationErrorResponseDto,
} from '../common/dto';
import { setRefreshTokenCookie } from '../users/cookies.util';
import { JwtPayload } from '../users/types';
import { CreateTenantDto, CurrentTenantResponseDto } from './dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@ApiBearerAuth()
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @SkipTenantCheck()
  @Get('current')
  @ApiOperation({
    summary: 'Get current tenant details',
    description:
      'Resolves and returns the active tenant details matching the request hostname (subdomain). Throws 404 if the request is on the apex domain or if the subdomain is invalid/inactive.',
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
  getCurrent(@Req() req: Request): CurrentTenantResponseDto {
    if (!req.tenant) {
      throw new NotFoundException('Workspace not found');
    }
    const { id, subdomain, name, type } = req.tenant;
    return { id, subdomain, name, type };
  }

  @Public()
  @SkipTenantCheck()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new tenant',
    description:
      'Registers a new tenant/workspace. If the requester is signed in, their existing user account becomes the owner. Otherwise, a new user account is created with the provided owner credentials. Returns an access token and sets the refresh token cookie.',
  })
  @ApiCreatedResponse({
    type: AccessTokenResponseDto,
    description:
      'Tenant created successfully. Access token returned in response body, and refresh token set in cookies.',
  })
  @ApiBadRequestResponse({
    type: TenantValidationErrorResponseDto,
    description:
      'Invalid subdomain format, missing required owner fields for anonymous registration, or validation constraints failed.',
  })
  @ApiConflictResponse({
    type: ConflictErrorResponseDto,
    description:
      'Subdomain is reserved, subdomain is already in use, or owner email is already in use by a different account.',
  })
  async createTenant(
    @Body() dto: CreateTenantDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const currentUserId = await this.tryExtractUserId(req);
    const tokens = await this.tenantsService.createTenant(dto, currentUserId);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }

  private async tryExtractUserId(req: Request): Promise<string | null> {
    const header = req.get('authorization');
    if (!header) return null;
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return null;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(match[1], {
        secret: this.configService.getOrThrow<string>('AT_SECRET'),
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
