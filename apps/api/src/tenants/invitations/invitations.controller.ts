import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GetCurrentUser } from '../../common/decorators';
import { Public, SkipTenantCheck } from '../../common/decorators';
import { MessageResponseDto } from '../../common/dto';
import {
  AcceptInvitationDto,
  InviteUserDto,
  ValidateInvitationResponseDto,
} from './dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@Controller('tenants/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * =========================
   * INVITE USER
   * =========================
   */
  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invite user',
    description:
      'Invites a user to join the current tenant. If user does not exist, a placeholder account is created.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Invitation sent successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid role assignment or validation failed.',
  })
  @ApiConflictResponse({
    description: 'User is already a member of this tenant or already invited.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing bearer token.',
  })
  async inviteUser(
    @Body() dto: InviteUserDto,
    @GetCurrentUser('tenantId') tenantId?: string,
    @GetCurrentUser('sub') userId?: string,
  ): Promise<MessageResponseDto> {
    if (!tenantId || !userId) {
      throw new Error('Invalid authentication context: tenant or user missing');
    }

    return this.invitationsService.inviteUser(dto, tenantId, userId);
  }

  /**
   * =========================
   * VALIDATE INVITATION
   * =========================
   */
  @Public()
  @SkipTenantCheck()
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate invitation',
    description: 'Validates invitation token and returns metadata.',
  })
  @ApiOkResponse({
    type: ValidateInvitationResponseDto,
    description: 'Invitation is valid.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid, cancelled, or expired invitation.',
  })
  async validateInvitation(
    @Query('token') token: string,
  ): Promise<ValidateInvitationResponseDto> {
    if (!token) {
      throw new Error('Token query parameter is required.');
    }

    return this.invitationsService.validateInvitation(token);
  }

  /**
   * =========================
   * ACCEPT INVITATION
   * =========================
   */
  @Public()
  @SkipTenantCheck()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accepts invitation and activates tenant membership.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Invitation accepted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid token, expired invitation, or missing password.',
  })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<MessageResponseDto> {
    return this.invitationsService.acceptInvitation(dto);
  }

  /**
   * =========================
   * RESEND INVITATION
   * =========================
   */
  @Post(':id/resend')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend invitation',
    description: 'Regenerates invitation token and sends email again.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Invitation resent successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found.',
  })
  @ApiBadRequestResponse({
    description: 'Only pending invitations can be resent.',
  })
  async resendInvitation(
    @Param('id') membershipId: string,
    @GetCurrentUser('tenantId') tenantId?: string,
  ): Promise<MessageResponseDto> {
    if (!tenantId) {
      throw new Error(
        'Invalid authentication context: tenantId missing from token',
      );
    }

    return this.invitationsService.resendInvitation(membershipId, tenantId);
  }

  /**
   * =========================
   * CANCEL INVITATION
   * =========================
   */
  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel invitation',
    description: 'Cancels a pending invitation.',
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: 'Invitation cancelled successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Invitation not found.',
  })
  @ApiBadRequestResponse({
    description: 'Only pending invitations can be cancelled.',
  })
  async cancelInvitation(
    @Param('id') membershipId: string,
    @GetCurrentUser('tenantId') tenantId?: string,
  ): Promise<MessageResponseDto> {
    if (!tenantId) {
      throw new Error(
        'Invalid authentication context: tenantId missing from token',
      );
    }

    return this.invitationsService.cancelInvitation(membershipId, tenantId);
  }
}
