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
  BulkCreateEnrolmentDto,
  CreateEnrolmentDto,
  UpdateEnrolmentDto,
} from './dto';
import { EnrolmentsService } from './enrolments.service';

@ApiTags('Enrolments')
@ApiBearerAuth()
@Controller('enrolments')
export class EnrolmentsController {
  constructor(private readonly enrolmentsService: EnrolmentsService) {}

  // ---------------------------------------------------------------------------
  // GET /enrolments
  // ---------------------------------------------------------------------------
  @Get()
  @RequirePermissions(PERMS.enrolment.view)
  @ApiOperation({
    summary: 'List enrolments',
    description:
      'Returns all enrolments for the tenant. Filter by studentProfileId, classId, or status.',
  })
  @ApiQuery({ name: 'studentProfileId', required: false })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'WITHDRAWN', 'COMPLETED'],
  })
  @ApiOkResponse({ description: 'Enrolments retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('studentProfileId') studentProfileId?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.findAll(tenantId, {
      studentProfileId,
      classId,
      status,
    });
  }

  // ---------------------------------------------------------------------------
  // GET /enrolments/:id
  // ---------------------------------------------------------------------------
  @Get(':id')
  @RequirePermissions(PERMS.enrolment.view)
  @ApiOperation({ summary: 'Get enrolment detail' })
  @ApiOkResponse({ description: 'Enrolment retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Enrolment not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // POST /enrolments — enrol a student into a class
  // ---------------------------------------------------------------------------
  @Post()
  @RequirePermissions(PERMS.enrolment.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enrol a student into a class',
    description:
      'Creates a new enrolment. ' +
      'Guards: student must be ACTIVE, class must be ACTIVE in a non-archived term, ' +
      'class must have available capacity, student must not already have an active enrolment.',
  })
  @ApiCreatedResponse({ description: 'Enrolment created successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateEnrolmentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.create(tenantId, userId, dto);
  }

  // ---------------------------------------------------------------------------
  // POST /enrolments/bulk — bulk enrol students into a class
  // ---------------------------------------------------------------------------
  @Post('bulk')
  @RequirePermissions(PERMS.enrolment.create)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk enrol students into a class',
    description:
      'Enrols multiple students into a single class. Supports partial success — ' +
      'returns which enrolments succeeded and which failed with reasons.',
  })
  @ApiOkResponse({
    description: 'Bulk enrolment completed. Check succeeded/failed arrays.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async bulkCreate(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: BulkCreateEnrolmentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.bulkCreate(tenantId, userId, dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /enrolments/:id — update status (ACTIVE → WITHDRAWN | COMPLETED)
  // ---------------------------------------------------------------------------
  @Patch(':id')
  @RequirePermissions(PERMS.enrolment.edit)
  @ApiOperation({
    summary: 'Update enrolment status',
    description:
      'Change enrolment status. Only ACTIVE enrolments can transition to WITHDRAWN or COMPLETED.',
  })
  @ApiOkResponse({ description: 'Enrolment updated successfully.' })
  @ApiNotFoundResponse({ description: 'Enrolment not found.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrolmentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.update(tenantId, userId, id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /enrolments/:id — withdraw (status change, record preserved)
  // ---------------------------------------------------------------------------
  @Delete(':id')
  @RequirePermissions(PERMS.enrolment.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw a student from a class',
    description:
      'Sets enrolment status to WITHDRAWN. Record is preserved for audit. ' +
      'Optional withdrawReason can be provided in the request body.',
  })
  @ApiOkResponse({ description: 'Student withdrawn successfully.' })
  @ApiNotFoundResponse({ description: 'Enrolment not found.' })
  async withdraw(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { withdrawReason?: string },
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.enrolmentsService.withdraw(
      tenantId,
      userId,
      id,
      body?.withdrawReason,
    );
  }
}
