import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
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
