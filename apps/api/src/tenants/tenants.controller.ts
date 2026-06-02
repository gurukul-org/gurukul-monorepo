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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { Request, Response } from 'express';

import { Public, SkipTenantCheck } from '../common/decorators';
import { setRefreshTokenCookie } from '../users/cookies.util';
import { JwtPayload } from '../users/types';
import { CreateTenantDto } from './dto';
import { TenantsService } from './tenants.service';

interface CurrentTenantResponse {
  id: string;
  subdomain: string;
  name: string;
  type: string;
}

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @SkipTenantCheck()
  @Get('current')
  getCurrent(@Req() req: Request): CurrentTenantResponse {
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
  async createTenant(
    @Body() dto: CreateTenantDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
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
