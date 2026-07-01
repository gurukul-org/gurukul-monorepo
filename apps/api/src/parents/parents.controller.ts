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
import { CreateParentDto, UpdateParentDto } from './dto';
import { ParentsService } from './parents.service';

@ApiTags('parents')
@ApiBearerAuth()
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

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
