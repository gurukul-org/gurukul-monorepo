import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
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
} from '@nestjs/swagger';

import { PERMS } from '@repo/permissions';

import {
  GetCurrentTenant,
  GetCurrentUser,
  RequirePermissions,
} from '../common/decorators';

import { CreateRoleDto, UpdateRoleDto } from './dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMS.role.view)
  @ApiOperation({
    summary: 'List all roles',
    description:
      'Returns all roles for the current tenant with their permissions and member counts.',
  })
  @ApiOkResponse({ description: 'Roles retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(@GetCurrentTenant('id') tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.rolesService.findAll(tenantId);
  }

  @Get('permissions/registry')
  @RequirePermissions(PERMS.role.view)
  @ApiOperation({
    summary: 'Get permissions registry',
    description:
      'Returns the full permissions registry grouped by category, used by the role editor UI.',
  })
  @ApiOkResponse({ description: 'Permissions registry retrieved.' })
  getPermissionsRegistry() {
    return this.rolesService.getPermissionsRegistry();
  }

  @Get(':id')
  @RequirePermissions(PERMS.role.view)
  @ApiOperation({
    summary: 'Get role details',
    description:
      'Returns a single role with its permissions and member count.',
  })
  @ApiOkResponse({ description: 'Role retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) roleId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.rolesService.findOne(tenantId, roleId);
  }

  @Post()
  @RequirePermissions(PERMS.role.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a custom role',
    description:
      'Creates a new custom role. The rank must be higher (lower privilege) than the caller\'s highest role rank.',
  })
  @ApiCreatedResponse({ description: 'Role created successfully.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiConflictResponse({ description: 'Role name already exists.' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or rank violation.',
  })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @Body() dto: CreateRoleDto,
  ) {
    if (!tenantId || !membershipId)
      throw new ForbiddenException('Tenant context required.');
    const callerRank =
      await this.rolesService.getCallerHighestRank(membershipId);
    return this.rolesService.create(tenantId, dto, callerRank);
  }

  @Patch(':id')
  @RequirePermissions(PERMS.role.edit)
  @ApiOperation({
    summary: 'Update a role',
    description:
      'Updates a role\'s name, description, rank, and/or permissions. System roles can only have their permissions and description modified.',
  })
  @ApiOkResponse({ description: 'Role updated successfully.' })
  @ApiBadRequestResponse({
    description: 'Validation failed or system role restriction.',
  })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or rank violation.',
  })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @Param('id', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (!tenantId || !membershipId)
      throw new ForbiddenException('Tenant context required.');
    const callerRank =
      await this.rolesService.getCallerHighestRank(membershipId);
    return this.rolesService.update(tenantId, roleId, dto, callerRank);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.role.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a custom role',
    description:
      'Soft-deletes a custom role. System roles cannot be deleted. Roles with assigned members must have all assignments removed first.',
  })
  @ApiOkResponse({ description: 'Role deleted successfully.' })
  @ApiBadRequestResponse({
    description: 'System role or role has assigned members.',
  })
  @ApiNotFoundResponse({ description: 'Role not found.' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or rank violation.',
  })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @Param('id', ParseUUIDPipe) roleId: string,
  ) {
    if (!tenantId || !membershipId)
      throw new ForbiddenException('Tenant context required.');
    const callerRank =
      await this.rolesService.getCallerHighestRank(membershipId);
    return this.rolesService.remove(tenantId, roleId, callerRank);
  }
}
