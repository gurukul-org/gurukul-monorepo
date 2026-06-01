import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Request, Response } from 'express';

import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
  SkipTenantCheck,
} from '../common/decorators';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './cookies.util';
import { LoginDto } from './dto';
import { RtGuard } from './guards';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @SkipTenantCheck()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tenantId = req.tenant?.id;
    const tokens = await this.usersService.login(dto, tenantId);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signout(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<boolean> {
    clearRefreshTokenCookie(res, this.configService);
    return this.usersService.logout(userId, refreshToken);
  }

  @Public()
  @SkipTenantCheck()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.usersService.refreshTokens(userId, refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }
}
