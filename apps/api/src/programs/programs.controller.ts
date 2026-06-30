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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { PERMS } from '@repo/permissions';

import {
  GetCurrentTenant,
  GetCurrentUserId,
  RequirePermissions,
} from '../common/decorators';
import { CreateProgramDto, UpdateProgramDto } from './dto';
import { ProgramsService } from './programs.service';

@ApiTags('Programs')
@ApiBearerAuth()
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @RequirePermissions(PERMS.program.view)
  @ApiOperation({
    summary: 'List all academic programs',
    description:
      'Returns all programs for the current tenant, sorted by creation date descending.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'archived'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
  })
  @ApiOkResponse({ description: 'Programs retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.findAll(tenantId, { status, search });
  }

  @Get(':id')
  @RequirePermissions(PERMS.program.view)
  @ApiOperation({
    summary: 'Get details of an academic program',
    description: 'Returns detail information of a specific academic program.',
  })
  @ApiOkResponse({ description: 'Program retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Program not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMS.program.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new program',
    description: 'Creates a new academic program within the tenant.',
  })
  @ApiCreatedResponse({ description: 'Program created successfully.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateProgramDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMS.program.edit)
  @ApiOperation({
    summary: 'Update a program',
    description:
      'Updates details of a program. Warns user if code is changed and downstream references exist.',
  })
  @ApiOkResponse({ description: 'Program updated successfully.' })
  @ApiNotFoundResponse({ description: 'Program not found.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.update(tenantId, userId, id, dto);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMS.program.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a program',
    description: 'Soft-deletes a program, marking it archived.',
  })
  @ApiOkResponse({ description: 'Program archived successfully.' })
  async archive(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.archive(tenantId, userId, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.program.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hard delete a program',
    description:
      'Hard-deletes a program. Only allowed if there are zero courses under it.',
  })
  @ApiOkResponse({ description: 'Program deleted successfully.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.programsService.remove(tenantId, userId, id);
  }
}
