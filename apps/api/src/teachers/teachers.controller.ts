import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { PERMS } from '@repo/permissions';

import { GetCurrentTenant, RequirePermissions } from '../common/decorators';
import { ALL_TEACHER_STATUSES } from './teachers.constants';
import { TeachersService } from './teachers.service';

@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @RequirePermissions(PERMS.teacher.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of teacher profiles' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ALL_TEACHER_STATUSES })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async findAll(
    @GetCurrentTenant('id') tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.teachersService.findAll(
      tenantId,
      search,
      status,
      limit ? parseInt(limit, 10) : undefined,
      cursor,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMS.teacher.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get teacher profile detail' })
  @ApiOkResponse({ description: 'Teacher details retrieved successfully.' })
  @ApiNotFoundResponse({ description: 'Teacher profile not found.' })
  async findOne(
    @GetCurrentTenant('id') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.teachersService.findOne(tenantId, id);
  }
}
