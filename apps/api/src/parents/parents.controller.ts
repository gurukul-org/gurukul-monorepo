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
import { CreateParentDto, UpdateParentDto } from './dto';
import { ParentsService } from './parents.service';

@ApiTags('parents')
@ApiBearerAuth()
@Controller('parents')
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly memberImportService: MemberImportService,
  ) {}

  @Get()
  @RequirePermissions(PERMS.parent.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of parent profiles' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'filterNoStudents', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('search') search?: string,
    @Query('filterNoStudents') filterNoStudents?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    const filterBool = filterNoStudents === 'true';
    return this.parentsService.findAll(
      tenantId,
      search,
      filterBool,
      limit ? Number(limit) : undefined,
      cursor,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMS.parent.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get parent profile detail' })
  @ApiOkResponse({ description: 'Parent details retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Parent profile not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.parentsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(PERMS.parent.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new parent profile' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async create(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateParentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.parentsService.create(tenantId, userId, dto);
  }

  // ---------------------------------------------------------------------------
  // POST /parents/bulk — queue a CSV import of parent accounts
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
            'CSV with columns: email, firstName, lastName, and optional emergencyPhone.',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Queue a bulk parent import from a CSV file',
    description:
      'Accepts a CSV (email, firstName, lastName + optional emergencyPhone), ' +
      'enqueues a background job, and returns a jobId immediately. Poll ' +
      'GET /parents/bulk/:jobId for progress and the final result. ' +
      'Each row pre-creates a parent account (User + PENDING membership + ' +
      'Parent role + profile); no invitation emails are sent. Invite later ' +
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
      role: 'parent',
      tenantId,
      userId,
      csvContent,
      scopes: user.scopes ?? [],
      isAdmin: user.isAdmin ?? false,
    });
  }

  // ---------------------------------------------------------------------------
  // GET /parents/bulk/:jobId — poll import progress / result
  // ---------------------------------------------------------------------------
  @Get('bulk/:jobId')
  @RequirePermissions(PERMS.user.invite)
  @ApiOperation({
    summary: 'Get the status of a bulk parent import job',
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

  @Patch(':id')
  @RequirePermissions(PERMS.parent.edit)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update parent profile fields' })
  @ApiOkResponse({ description: 'Parent details updated successfully.' })
  @ApiNotFoundResponse({ description: 'Parent profile not found.' })
  async update(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.parentsService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMS.parent.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete parent profile',
    description:
      'Performs hard-delete if parent has zero linked students; soft-deletes otherwise to preserve history.',
  })
  @ApiOkResponse({ description: 'Parent deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Parent profile not found.' })
  async remove(
    @GetCurrentTenant('id') tenantId: string,
    @GetCurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.parentsService.remove(tenantId, userId, id);
  }
}
