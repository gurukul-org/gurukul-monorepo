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
import {
  AssignInstructorDto,
  UpdateInstructorCoursesDto,
} from '../instructors/dto';
import { InstructorsService } from '../instructors/instructors.service';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly instructorsService: InstructorsService,
  ) {}

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
  @ApiQuery({
    name: 'section',
    required: false,
    type: String,
    description: 'Class/Section ID',
  })
  @ApiOkResponse({ description: 'Classes retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('term') term?: string,
    @Query('program') program?: string,
    @Query('course') course?: string,
    @Query('instructor') instructor?: string,
    @Query('section') section?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.classesService.findAll(tenantId, {
      term,
      program,
      course,
      instructor,
      section,
    });
  }

  @Get('options')
  @RequirePermissions(PERMS.class.view)
  @ApiOperation({
    summary: 'List paginated class section options',
    description:
      'Returns class sections formatted for select options with search and pagination.',
  })
  async getOptions(
    @GetCurrentTenant('id') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.classesService.getOptions(tenantId, pageNum, limitNum, search);
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

  // ---------------------------------------------------------------------------
  // Instructor Assignments
  // ---------------------------------------------------------------------------

  @Post(':classId/instructors')
  @RequirePermissions(PERMS.instructor.assign)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign an instructor to a class',
    description: 'Assigns an eligible member to the specified class section.',
  })
  @ApiCreatedResponse({ description: 'Instructor assigned successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async assignInstructor(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: AssignInstructorDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.instructorsService.assignInstructor(
      tenantId,
      classId,
      userId,
      dto,
    );
  }

  @Patch(':classId/instructors/:id/primary')
  @RequirePermissions(PERMS.instructor.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Designate instructor as primary',
    description:
      'Promotes the specified instructor to primary, demoting any current primary.',
  })
  @ApiOkResponse({ description: 'Instructor promoted successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async promoteInstructor(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.instructorsService.promoteToPrimary(
      tenantId,
      classId,
      userId,
      id,
    );
  }

  @Patch(':classId/instructors/:id/courses')
  @RequirePermissions(PERMS.instructor.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the courses an instructor teaches in this class',
    description:
      'Replaces the set of courses (from the class program) this instructor teaches within this class.',
  })
  @ApiOkResponse({ description: 'Instructor courses updated successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async updateInstructorCourses(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstructorCoursesDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.instructorsService.updateInstructorCourses(
      tenantId,
      classId,
      userId,
      id,
      dto.courseIds,
    );
  }

  @Delete(':classId/instructors/:id')
  @RequirePermissions(PERMS.instructor.remove)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove an instructor from a class',
    description:
      'Soft-deletes the instructor assignment record. Enforces validations on removing primary.',
  })
  @ApiOkResponse({ description: 'Instructor removed successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async removeInstructor(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.instructorsService.removeInstructor(
      tenantId,
      classId,
      userId,
      id,
    );
  }
}
