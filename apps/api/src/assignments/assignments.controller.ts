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
  ApiBearerAuth,
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
  GetCurrentUserId,
  RequirePermissions,
} from '../common/decorators';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { MarkSubmissionDto } from './dto/mark-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @RequirePermissions(PERMS.homework.create)
  @ApiOperation({ summary: 'Create a new homework assignment' })
  @ApiCreatedResponse({ description: 'Assignment created successfully.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.assignmentsService.create(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions(PERMS.homework.viewOwn)
  @ApiOperation({ summary: 'List all homework assignments' })
  @ApiOkResponse({ description: 'Assignments retrieved successfully.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @GetCurrentUser() user: { scopes?: string[]; isAdmin?: boolean },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    if (!membershipId) throw new ForbiddenException('Membership required.');

    const isStudent =
      !user.isAdmin &&
      !user.scopes?.includes(PERMS.homework.create.id) &&
      !user.scopes?.includes('all-homework') &&
      !user.scopes?.includes('create-homework');

    return this.assignmentsService.findAll(tenantId, membershipId, isStudent);
  }

  @Get(':id')
  @RequirePermissions(PERMS.homework.viewOwn)
  @ApiOperation({ summary: 'Get details of a single assignment' })
  @ApiOkResponse({ description: 'Assignment details retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Assignment not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @GetCurrentUser() user: { scopes?: string[]; isAdmin?: boolean },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    if (!membershipId) throw new ForbiddenException('Membership required.');

    const isStudent =
      !user.isAdmin &&
      !user.scopes?.includes(PERMS.homework.create.id) &&
      !user.scopes?.includes('all-homework') &&
      !user.scopes?.includes('create-homework');

    return this.assignmentsService.findOne(
      tenantId,
      id,
      membershipId,
      isStudent,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMS.homework.delete)
  @ApiOperation({ summary: 'Soft delete an assignment' })
  @ApiOkResponse({ description: 'Assignment deleted successfully.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.assignmentsService.delete(tenantId, id);
  }

  @Post(':id/submissions')
  @RequirePermissions(PERMS.homework.submit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit homework response as a student' })
  @ApiOkResponse({ description: 'Homework submitted successfully.' })
  async submit(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser('membershipId') membershipId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    if (!membershipId) throw new ForbiddenException('Membership required.');
    return this.assignmentsService.submit(tenantId, id, membershipId, dto);
  }

  @Get(':id/submissions')
  @RequirePermissions(PERMS.homework.mark)
  @ApiOperation({
    summary: 'Get all submissions for an assignment (for grading/review)',
  })
  @ApiOkResponse({ description: 'Submissions retrieved successfully.' })
  async getSubmissions(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.assignmentsService.getSubmissions(tenantId, id);
  }

  @Patch('submissions/:submissionId/mark')
  @RequirePermissions(PERMS.homework.mark)
  @ApiOperation({ summary: 'Mark and grade a student submission' })
  @ApiOkResponse({ description: 'Submission graded successfully.' })
  async mark(
    @GetCurrentTenant('id') tenantId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: MarkSubmissionDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.assignmentsService.mark(tenantId, submissionId, userId, dto);
  }
}
