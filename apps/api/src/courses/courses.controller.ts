import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @RequirePermissions(PERMS.course.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new course',
    description:
      'Creates a new course associated with a program for the current tenant.',
  })
  @ApiOkResponse({ description: 'Course created successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateCourseDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.coursesService.create(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions(PERMS.course.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all courses',
    description:
      'Returns all non-deleted courses for the current tenant, filterable by program.',
  })
  @ApiQuery({
    name: 'programId',
    required: false,
    type: String,
    description: 'Filter by academic program ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search string matching course name or code',
  })
  @ApiOkResponse({ description: 'Courses retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('programId') programId?: string,
    @Query('search') search?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.coursesService.findAll(tenantId, { programId, search });
  }

  @Get(':id')
  @RequirePermissions(PERMS.course.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course details by ID',
    description:
      'Returns details of a specific course, including program info.',
  })
  @ApiOkResponse({ description: 'Course details retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.coursesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(PERMS.course.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update course details',
    description: 'Updates parameters of an existing academic course.',
  })
  @ApiOkResponse({ description: 'Course updated successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.coursesService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.course.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete course',
    description:
      'Soft deletes an academic course if no class sections are scheduled for its program.',
  })
  @ApiOkResponse({ description: 'Course deleted successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    await this.coursesService.remove(tenantId, userId, id);
    return { message: 'Course deleted successfully.' };
  }
}
