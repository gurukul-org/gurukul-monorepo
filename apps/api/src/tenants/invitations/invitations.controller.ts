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
  UseGuards,
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

import { GetCurrentUserId, Public, SkipTenantCheck } from '../../common/decorators';
import { MessageResponseDto } from '../../common/dto';
import { AcceptInvitationDto, InviteUserDto, ValidateInvitationResponseDto } from './dto';
import { InvitationsService } from './invitations.service';
import type { Request } from 'express';
import { Req } from '@nestjs/common';

@ApiTags('Invitations')
@Controller('tenants/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invite user',
    description: 'Invites a user to join the current tenant with predefined roles. If the user does not exist, a placeholder account is created and the user completes onboarding by setting their password.',
  })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Invitation sent successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid role assignment or validation failed.' })
  @ApiConflictResponse({ description: 'User is already a member of this tenant or already invited.' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing bearer token.' })
  async inviteUser(
    @Body() dto: InviteUserDto,
    @Req() req: Request,
    @GetCurrentUserId() userId: string,
  ): Promise<MessageResponseDto> {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      throw new Error('Tenant is missing from the request');
    }
    return this.invitationsService.inviteUser(dto, tenantId, userId);
  }

  @Public()
  @SkipTenantCheck()
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate invitation',
    description: 'Validates an invitation token and returns details about the invitation.',
  })
  @ApiOkResponse({ type: ValidateInvitationResponseDto, description: 'Invitation is valid.' })
  @ApiBadRequestResponse({ description: 'Invalid, cancelled, or expired invitation.' })
  async validateInvitation(
    @Query('token') token: string,
  ): Promise<ValidateInvitationResponseDto> {
    if (!token) {
      throw new Error('Token query parameter is required.');
    }
    return this.invitationsService.validateInvitation(token);
  }

  @Public()
  @SkipTenantCheck()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accepts a pending invitation. If the user requires password setup, a password must be provided.',
  })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Invitation accepted successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid token, expired invitation, or missing password for new user.' })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<MessageResponseDto> {
    return this.invitationsService.acceptInvitation(dto);
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend invitation',
    description: 'Resends a pending invitation. Generates a new secure token and sends another email.',
  })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Invitation resent successfully.' })
  @ApiNotFoundResponse({ description: 'Invitation not found.' })
  @ApiBadRequestResponse({ description: 'Only pending invitations can be resent.' })
  async resendInvitation(
    @Param('id') membershipId: string,
    @Req() req: Request,
  ): Promise<MessageResponseDto> {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      throw new Error('Tenant is missing from the request');
    }
    return this.invitationsService.resendInvitation(membershipId, tenantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel invitation',
    description: 'Cancels a pending invitation.',
  })
  @ApiOkResponse({ type: MessageResponseDto, description: 'Invitation cancelled successfully.' })
  @ApiNotFoundResponse({ description: 'Invitation not found.' })
  @ApiBadRequestResponse({ description: 'Only pending invitations can be cancelled.' })
  async cancelInvitation(
    @Param('id') membershipId: string,
    @Req() req: Request,
  ): Promise<MessageResponseDto> {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      throw new Error('Tenant is missing from the request');
    }
    return this.invitationsService.cancelInvitation(membershipId, tenantId);
  }
}
