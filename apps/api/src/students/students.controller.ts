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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
  GetCurrentUser,
  GetCurrentUserId,
  RequirePermissions,
} from '../common/decorators';
import { MEMBER_IMPORT_MAX_BYTES } from '../member-import/member-import.constants';
import { MemberImportService } from '../member-import/member-import.service';
import {
  type UploadedCsvFile,
  readCsvUpload,
} from '../member-import/member-import.util';
import {
  ChangeStudentStatusDto,
  CreateStudentDto,
  UpdateStudentDto,
} from './dto';
import { ALL_STUDENT_STATUSES } from './students.constants';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly memberImportService: MemberImportService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /students
  // ---------------------------------------------------------------------------
  @Get()
  @RequirePermissions(PERMS.student.view)
  @ApiOperation({
    summary: 'List all students',
    description:
      'Returns a paginated list of students for the current tenant. ' +
      'Supports free-text search by name or roll number and filtering by status.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or roll number',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ALL_STUDENT_STATUSES,
    description: 'Filter by student status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size (default 20)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for next page',
  })
  @ApiOkResponse({ description: 'Students retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.findAll(
      tenantId,
      search,
      status,
      limit ? parseInt(limit, 10) : 20,
      cursor,
    );
  }

  // ---------------------------------------------------------------------------
  // GET /students/:id
  // ---------------------------------------------------------------------------
  @Get(':id')
  @RequirePermissions(PERMS.student.view)
  @ApiOperation({
    summary: 'Get student detail',
    description:
      'Returns full student profile including enrolments, linked parents, and audit trail.',
  })
  @ApiOkResponse({ description: 'Student retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Student not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // POST /students
  // ---------------------------------------------------------------------------
  @Post()
  @RequirePermissions(PERMS.student.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a student profile',
    description:
      'Creates a new student profile. ' +
      'Optionally links to an existing active tenant membership. ' +
      'Roll number must be unique within the tenant. ' +
      'Admission date defaults to today if omitted. ' +
      'Initial status is always ACTIVE.',
  })
  @ApiCreatedResponse({ description: 'Student created successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateStudentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.create(tenantId, userId, dto);
  }

  // ---------------------------------------------------------------------------
  // POST /students/bulk — queue a CSV import of student accounts
  // ---------------------------------------------------------------------------
  @Post('bulk')
  @RequirePermissions(PERMS.user.invite)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MEMBER_IMPORT_MAX_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV with columns: email, firstName, lastName, and optional rollNumber, admissionDate.',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Queue a bulk student import from a CSV file',
    description:
      'Accepts a CSV (email, firstName, lastName + optional rollNumber, admissionDate), ' +
      'enqueues a background job, and returns a jobId immediately. Poll ' +
      'GET /students/bulk/:jobId for progress and the final result. ' +
      'Each row pre-creates a student account (User + PENDING membership + ' +
      'Student role + profile); no invitation emails are sent. Invite later ' +
      'to move them PENDING -> INVITED -> ACTIVE.',
  })
  @ApiCreatedResponse({
    description: 'Import queued. Returns { jobId } to poll for status.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async bulkCreate(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser() user: { scopes?: string[]; isAdmin?: boolean },
    @UploadedFile() file?: UploadedCsvFile,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    const csvContent = readCsvUpload(file);

    return this.memberImportService.enqueue({
      role: 'student',
      tenantId,
      userId,
      csvContent,
      scopes: user.scopes ?? [],
      isAdmin: user.isAdmin ?? false,
    });
  }

  // ---------------------------------------------------------------------------
  // GET /students/bulk/:jobId — poll import progress / result
  // ---------------------------------------------------------------------------
  @Get('bulk/:jobId')
  @RequirePermissions(PERMS.user.invite)
  @ApiOperation({
    summary: 'Get the status of a bulk student import job',
    description:
      'Returns the job state, progress, and — once completed — the import ' +
      'result { totalRows, created, skipped[] }, or the failure reason.',
  })
  @ApiOkResponse({ description: 'Job status retrieved.' })
  @ApiNotFoundResponse({ description: 'Job not found or expired.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async getImportStatus(
    @GetCurrentTenant('id') tenantId: string,
    @Param('jobId') jobId: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.memberImportService.getStatus(tenantId, jobId);
  }

  // ---------------------------------------------------------------------------
  // PATCH /students/:id
  // ---------------------------------------------------------------------------
  @Patch(':id')
  @RequirePermissions(PERMS.student.edit)
  @ApiOperation({
    summary: 'Update student profile',
    description:
      'Updates editable fields on a student profile. ' +
      'Roll number cannot be changed. ' +
      'Status changes must use the dedicated PATCH /students/:id/status endpoint.',
  })
  @ApiOkResponse({ description: 'Student updated successfully.' })
  @ApiNotFoundResponse({ description: 'Student not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.update(tenantId, userId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /students/:id/status
  // ---------------------------------------------------------------------------
  @Patch(':id/status')
  @RequirePermissions(PERMS.student.edit)
  @ApiOperation({
    summary: 'Change student status',
    description:
      'Transitions the student to a new status. ' +
      'GRADUATED is terminal — once set it cannot be changed. ' +
      'INACTIVE is reversible back to ACTIVE. ' +
      'Returns a warning (400) if the student has active enrolments; ' +
      'set ignoreWarnings: true in the body to acknowledge and proceed.',
  })
  @ApiOkResponse({ description: 'Student status updated successfully.' })
  @ApiNotFoundResponse({ description: 'Student not found.' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or terminal status.',
  })
  async changeStatus(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStudentStatusDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.changeStatus(tenantId, userId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /students/:id
  // ---------------------------------------------------------------------------
  @Delete(':id')
  @RequirePermissions(PERMS.student.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hard-delete a student profile',
    description:
      'Permanently deletes a student profile. ' +
      'Only allowed if the student has zero enrolments (active or historical). ' +
      'If any enrolment exists, set the student to INACTIVE status instead.',
  })
  @ApiOkResponse({ description: 'Student deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Student not found.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.studentsService.remove(tenantId, userId, id);
  }
}
