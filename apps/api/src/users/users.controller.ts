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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { Request, Response } from 'express';

import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
  SkipTenantCheck,
} from '../common/decorators';
import {
  AccessTokenResponseDto,
  ChangeEmailValidationErrorResponseDto,
  ChangePasswordValidationErrorResponseDto,
  ConflictErrorResponseDto,
  ForbiddenErrorResponseDto,
  ForgotPasswordValidationErrorResponseDto,
  LoginValidationErrorResponseDto,
  MessageResponseDto,
  ResetPasswordValidationErrorResponseDto,
  UnauthorizedErrorResponseDto,
  UpdateProfileValidationErrorResponseDto,
} from '../common/dto';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './cookies.util';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UserProfileResponseDto,
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
  @ApiOperation({
    summary: 'User login',
    description:
      "Authenticates user credentials and resolves the user's tenant memberships. Returns a new access token and sets the refresh token cookie.",
  })
  @ApiOkResponse({
    type: AccessTokenResponseDto,
    description: 'User successfully logged in.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description:
      'Access Denied: Invalid credentials or the user is not an active member of the requested tenant.',
  })
  @ApiBadRequestResponse({
    type: LoginValidationErrorResponseDto,
    description: 'Validation failed on email or password.',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const tenantId = req.tenant?.id;
    const tokens = await this.usersService.login(dto, tenantId);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @SkipTenantCheck()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Initiates a password reset flow. Sends a reset link containing a secure token to the provided email if the account exists.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Password reset email sent if the account exists.',
  })
  @ApiBadRequestResponse({
    type: ForgotPasswordValidationErrorResponseDto,
    description: 'Validation failed on email.',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.forgotPassword(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description:
      "Resets the user's password using a secure reset token received via email, and terminates all active sessions for that user.",
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Password reset successfully.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description: 'Invalid or expired reset token.',
  })
  @ApiBadRequestResponse({
    type: ResetPasswordValidationErrorResponseDto,
    description: 'Validation failed on token or password.',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the personal details of the currently authenticated user.',
  })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'User profile retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description:
      'Access Denied: User account not found or missing token context.',
  })
  async getProfile(
    @GetCurrentUserId() userId: string,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates profile fields of the currently authenticated user.',
  })
  @ApiOkResponse({
    type: UserProfileResponseDto,
    description: 'User profile updated successfully.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  @ApiBadRequestResponse({
    type: UpdateProfileValidationErrorResponseDto,
    description: 'Validation failed on profile parameters.',
  })
  async updateProfile(
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/password')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description:
      'Changes the password of the currently authenticated user and terminates all active sessions.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Password changed successfully.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description: 'Access Denied: Incorrect current password.',
  })
  @ApiBadRequestResponse({
    type: ChangePasswordValidationErrorResponseDto,
    description: 'Validation failed on old or new password.',
  })
  async changePassword(
    @GetCurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.changePassword(userId, dto);
  }

  @Patch('me/email')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change email',
    description:
      'Changes the email address of the currently authenticated user and terminates all active sessions.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Email changed successfully.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description: 'Access Denied: Incorrect password.',
  })
  @ApiConflictResponse({
    type: ConflictErrorResponseDto,
    description: 'Conflict: Email already exists on another account.',
  })
  @ApiBadRequestResponse({
    type: ChangeEmailValidationErrorResponseDto,
    description: 'Validation failed on email or password.',
  })
  async changeEmail(
    @GetCurrentUserId() userId: string,
    @Body() dto: ChangeEmailDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.changeEmail(userId, dto);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'User logout',
    description:
      'Logs the user out of the current session, removes the session token from database, and clears the refresh token cookie.',
  })
  @ApiOkResponse({
    type: Boolean,
    description: 'User successfully logged out.',
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorResponseDto,
    description: 'Invalid or missing bearer token.',
  })
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
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Rotates the session by validating the refresh token (read from cookies or Authorization Bearer header). Returns a new access token and sets a rotated refresh token cookie.',
  })
  @ApiOkResponse({
    type: AccessTokenResponseDto,
    description: 'Tokens successfully refreshed.',
  })
  @ApiForbiddenResponse({
    type: ForbiddenErrorResponseDto,
    description: 'Access Denied: Refresh token invalid, expired, or malformed.',
  })
  async refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenResponseDto> {
    const tokens = await this.usersService.refreshTokens(userId, refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken, this.configService);
    return { accessToken: tokens.accessToken };
  }
}
