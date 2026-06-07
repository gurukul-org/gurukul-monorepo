import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
  SkipTenantCheck,
} from '../common/decorators';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './cookies.util';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto';
import { AtGuard, RtGuard } from './guards';
import { UsersService } from './users.service';

@ApiTags('Users')
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
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
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

  @Public()
  @SkipTenantCheck()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.forgotPassword(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetCurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetCurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(userId, dto);
  }

  @Patch('me/email')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  async changeEmail(
    @GetCurrentUserId() userId: string,
    @Body() dto: ChangeEmailDto,
  ): Promise<{ message: string }> {
    return this.usersService.changeEmail(userId, dto);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed.' })
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
