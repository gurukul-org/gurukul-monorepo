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
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto, UpdateAcademicTermDto } from './dto';

@ApiTags('Academic Terms')
@ApiBearerAuth()
@Controller('academic-terms')
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Get()
  @RequirePermissions(PERMS.academicTerm.view)
  @ApiOperation({
    summary: 'List all academic terms',
    description:
      'Returns all academic terms for the current tenant, sorted by start date in descending order.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'upcoming', 'past', 'archived'],
  })
  @ApiOkResponse({ description: 'Academic terms retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('status') status?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.findAll(tenantId, status);
  }

  @Get(':id')
  @RequirePermissions(PERMS.academicTerm.view)
  @ApiOperation({
    summary: 'Get details of an academic term',
    description: 'Returns detail information of a specific academic term.',
  })
  @ApiOkResponse({ description: 'Academic term retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Academic term not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMS.academicTerm.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new academic term',
    description:
      'Creates a new academic term. Validates dates and checks for date overlaps.',
  })
  @ApiCreatedResponse({ description: 'Academic term created successfully.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateAcademicTermDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMS.academicTerm.edit)
  @ApiOperation({
    summary: 'Update an academic term',
    description:
      'Updates details of an academic term. Displays warning if modifying dates of a term with scheduled classes.',
  })
  @ApiOkResponse({ description: 'Academic term updated successfully.' })
  @ApiNotFoundResponse({ description: 'Academic term not found.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicTermDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.update(tenantId, userId, id, dto);
  }

  @Post(':id/activate')
  @RequirePermissions(PERMS.academicTerm.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate an academic term',
    description:
      'Sets an academic term active. Only one term can be active at a time.',
  })
  @ApiOkResponse({ description: 'Academic term activated successfully.' })
  async activate(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.activate(tenantId, userId, id);
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMS.academicTerm.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate an academic term',
    description: 'Sets an academic term inactive.',
  })
  @ApiOkResponse({ description: 'Academic term deactivated successfully.' })
  async deactivate(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.deactivate(tenantId, userId, id);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMS.academicTerm.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive an academic term',
    description: 'Soft-deletes an academic term, marking it archived.',
  })
  @ApiOkResponse({ description: 'Academic term archived successfully.' })
  async archive(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.archive(tenantId, userId, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.academicTerm.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hard delete an academic term',
    description:
      'Hard-deletes an academic term. Only allowed if there are zero classes or enrollments.',
  })
  @ApiOkResponse({ description: 'Academic term deleted successfully.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.academicTermsService.remove(tenantId, userId, id);
  }
}
