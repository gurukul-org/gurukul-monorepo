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

import { PrismaService } from 'nestjs-prisma';

import { PERMS } from '@repo/permissions';

import { GetCurrentTenant, RequirePermissions } from '../common/decorators';

@ApiTags('Instructors')
@ApiBearerAuth()
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMS.instructor.view)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List eligible instructors',
    description:
      'Returns all active members in the current tenant who can be assigned as instructors.',
  })
  @ApiOkResponse({ description: 'Instructors retrieved successfully.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  async findAll(@GetCurrentTenant('id') tenantId: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required.');

    // We fetch all active tenant memberships and include user details
    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
    }));
  }
}
