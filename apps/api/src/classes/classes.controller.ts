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
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @RequirePermissions(PERMS.class.view)
  @ApiOperation({
    summary: 'List all classes',
    description:
      'Returns all classes for the current tenant, filtered by query parameters.',
  })
  @ApiQuery({
    name: 'term',
    required: false,
    type: String,
    description: 'Academic Term ID',
  })
  @ApiQuery({
    name: 'program',
    required: false,
    type: String,
    description: 'Program ID',
  })
  @ApiQuery({
    name: 'course',
    required: false,
    type: String,
    description: 'Course ID',
  })
  @ApiQuery({
    name: 'instructor',
    required: false,
    type: String,
    description: 'Instructor Tenant Membership ID',
  })
  @ApiOkResponse({ description: 'Classes retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('term') term?: string,
    @Query('program') program?: string,
    @Query('course') course?: string,
    @Query('instructor') instructor?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.findAll(tenantId, {
      term,
      program,
      course,
      instructor,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMS.class.view)
  @ApiOperation({
    summary: 'Get details of a class',
    description:
      'Returns metadata, assigned instructors, and enrolled students for a specific class.',
  })
  @ApiOkResponse({ description: 'Class details retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMS.class.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new class',
    description: 'Creates a concrete class for a course within a term.',
  })
  @ApiCreatedResponse({ description: 'Class created successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateClassDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMS.class.edit)
  @ApiOperation({
    summary: 'Update class details',
    description:
      'Updates capacity, room, period, instructors, or status of a class.',
  })
  @ApiOkResponse({ description: 'Class updated successfully.' })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.update(tenantId, userId, id, dto);
  }

  @Post(':id/archive')
  @RequirePermissions(PERMS.class.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a class',
    description:
      'Marks class status as ARCHIVED. Preserves enrollment history but blocks new enrollments.',
  })
  @ApiOkResponse({ description: 'Class archived successfully.' })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async archive(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.archive(tenantId, userId, id);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.class.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hard-delete a class',
    description:
      'Deletes a class permanently. Allowed only if the class has zero historical enrollments.',
  })
  @ApiOkResponse({ description: 'Class deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.remove(tenantId, userId, id);
  }
}
