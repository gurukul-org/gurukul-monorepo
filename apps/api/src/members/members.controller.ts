import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PERMS } from '@repo/permissions';

import {
  GetCurrentTenant,
  GetCurrentUser,
  RequirePermissions,
} from '../common/decorators';
import { AddRolesDto, RemoveRolesDto, ReplaceRolesDto } from './dto';
import { MembersService } from './members.service';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // ---------------------------------------------------------------------------
  // POST /members/:membershipId/roles
  // Add one or more roles to a member (hybrid responsibilities support).
  // ---------------------------------------------------------------------------
  @Post(':membershipId/roles')
  @RequirePermissions(PERMS.user.edit)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add roles to a member',
    description:
      'Assigns one or more additional roles to an existing member. ' +
      'Supports hybrid-responsibility scenarios (e.g. an HOD who also teaches). ' +
      'Duplicate role assignments are rejected. The member\'s active sessions are ' +
      'invalidated so new permissions take effect on their next request.',
  })
  @ApiCreatedResponse({
    description: 'Roles added successfully.',
  })
  @ApiConflictResponse({
    description: 'One or more roles are already assigned to this member.',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or rank violation.',
  })
  @ApiNotFoundResponse({
    description: 'Target membership not found in this tenant.',
  })
  async addRoles(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') callerMembershipId: string,
    @GetCurrentUser('sub') callerUserId: string,
    @Param('membershipId', ParseUUIDPipe) targetMembershipId: string,
    @Body() dto: AddRolesDto,
  ) {
    if (!tenantId || !callerMembershipId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return this.membersService.addRoles(
      tenantId,
      callerMembershipId,
      callerUserId,
      targetMembershipId,
      dto,
    );
  }

  // ---------------------------------------------------------------------------
  // DELETE /members/:membershipId/roles
  // Remove one or more specific roles from a member.
  // ---------------------------------------------------------------------------
  @Delete(':membershipId/roles')
  @RequirePermissions(PERMS.user.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove specific roles from a member',
    description:
      'Removes one or more specific roles from a member without revoking their access entirely. ' +
      'The member must retain at least one role. ' +
      'An Owner cannot remove their own Owner role (self-demotion prevention). ' +
      'The member\'s active sessions are invalidated so reduced permissions take effect immediately.',
  })
  @ApiOkResponse({
    description: 'Roles removed successfully.',
  })
  @ApiForbiddenResponse({
    description:
      'Insufficient permissions, rank violation, or self-demotion attempt.',
  })
  @ApiNotFoundResponse({
    description: 'Target membership not found or role not assigned.',
  })
  async removeRoles(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') callerMembershipId: string,
    @GetCurrentUser('sub') callerUserId: string,
    @Param('membershipId', ParseUUIDPipe) targetMembershipId: string,
    @Body() dto: RemoveRolesDto,
  ) {
    if (!tenantId || !callerMembershipId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return this.membersService.removeRoles(
      tenantId,
      callerMembershipId,
      callerUserId,
      targetMembershipId,
      dto,
    );
  }

  // ---------------------------------------------------------------------------
  // PUT /members/:membershipId/roles
  // Atomically swap one role for another (or multiple swaps in one request).
  // ---------------------------------------------------------------------------
  @Put(':membershipId/roles')
  @RequirePermissions(PERMS.user.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace a member\'s roles',
    description:
      'Atomically removes one role and assigns another per swap pair. ' +
      'Supports multiple swap pairs in a single request. ' +
      'All guards apply: rank enforcement, self-demotion prevention, last-role guard, and duplicate check. ' +
      'The member\'s active sessions are invalidated so the new permissions take effect on their next request.',
  })
  @ApiOkResponse({
    description: 'Roles replaced successfully.',
  })
  @ApiForbiddenResponse({
    description:
      'Insufficient permissions, rank violation, or self-demotion attempt.',
  })
  @ApiNotFoundResponse({
    description: 'Target membership not found or role IDs invalid.',
  })
  async replaceRoles(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') callerMembershipId: string,
    @GetCurrentUser('sub') callerUserId: string,
    @Param('membershipId', ParseUUIDPipe) targetMembershipId: string,
    @Body() dto: ReplaceRolesDto,
  ) {
    if (!tenantId || !callerMembershipId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return this.membersService.replaceRoles(
      tenantId,
      callerMembershipId,
      callerUserId,
      targetMembershipId,
      dto,
    );
  }
}
