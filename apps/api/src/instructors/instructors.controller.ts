import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PERMS } from '@repo/permissions';

import { GetCurrentTenant, RequirePermissions } from '../common/decorators';
import { InstructorsService } from './instructors.service';

@ApiTags('Instructors')
@ApiBearerAuth()
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('options')
  @RequirePermissions(PERMS.instructor.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List paginated instructor options',
    description:
      'Returns active instructors formatted for select options with search and pagination.',
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
    return this.instructorsService.getOptions(
      tenantId,
      pageNum,
      limitNum,
      search,
    );
  }

  @Get()
  @RequirePermissions(PERMS.instructor.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List eligible instructors',
    description:
      'Returns all active members in the current tenant who possess the Faculty role or any role with teaching capability.',
  })
  @ApiOkResponse({
    description: 'Eligible instructors retrieved successfully.',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(@GetCurrentTenant('id') tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');
    return this.instructorsService.findAllEligible(tenantId);
  }
}
