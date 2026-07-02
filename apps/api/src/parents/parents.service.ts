import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { CreateParentDto, UpdateParentDto } from './dto';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const MEMBERSHIP_WITH_USER = {
  select: {
    id: true,
    status: true,
    user: { select: USER_SELECT },
  },
} as const;

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    search?: string,
    filterNoStudents?: boolean,
    limit = 20,
    cursor?: string,
  ) {
    const take = limit > 0 ? limit : 20;

    const searchFilter = search
      ? {
          OR: [
            {
              membership: {
                user: {
                  firstName: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
            {
              membership: {
                user: {
                  lastName: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
            {
              emergencyPhone: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const noStudentsFilter = filterNoStudents
      ? {
          students: {
            none: {},
          },
        }
      : {};

    const parents = await this.prisma.parentProfile.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...searchFilter,
        ...noStudentsFilter,
      },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        membership: MEMBERSHIP_WITH_USER,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    const hasNextPage = parents.length > take;
    if (hasNextPage) parents.pop();
    const nextCursor = hasNextPage ? parents[parents.length - 1].id : null;

    return {
      parents: parents.map((p) => this.formatListItem(p)),
      nextCursor,
    };
  }

  async findOne(tenantId: string, id: string) {
    const parent = await this.prisma.parentProfile.findFirst({
      where: { id, tenantId },
      include: {
        membership: MEMBERSHIP_WITH_USER,
        creator: { select: USER_SELECT },
        updater: { select: USER_SELECT },
        students: {
          include: {
            student: {
              include: {
                membership: MEMBERSHIP_WITH_USER,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    return this.formatDetail(parent);
  }

  async create(tenantId: string, userId: string, dto: CreateParentDto) {
    if (dto.tenantMembershipId) {
      await this.validateMembershipLink(tenantId, dto.tenantMembershipId);
    }

    const parent = await this.prisma.parentProfile.create({
      data: {
        tenantId,
        tenantMembershipId: dto.tenantMembershipId ?? null,
        emergencyPhone: dto.emergencyPhone,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Parent created structure: ${JSON.stringify({
        action: 'CREATE_PARENT',
        parentProfileId: parent.id,
        tenantId,
        actorUserId: userId,
        emergencyPhone: dto.emergencyPhone,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return this.findOne(tenantId, parent.id);
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateParentDto,
  ) {
    const parent = await this.prisma.parentProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    if (
      dto.tenantMembershipId !== undefined &&
      dto.tenantMembershipId !== null
    ) {
      await this.validateMembershipLink(tenantId, dto.tenantMembershipId, id);
    }

    await this.prisma.parentProfile.update({
      where: { id },
      data: {
        ...(dto.tenantMembershipId !== undefined && {
          tenantMembershipId: dto.tenantMembershipId,
        }),
        ...(dto.emergencyPhone && {
          emergencyPhone: dto.emergencyPhone,
        }),
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Parent updated structure: ${JSON.stringify({
        action: 'UPDATE_PARENT',
        parentProfileId: id,
        tenantId,
        actorUserId: userId,
        changes: {
          ...(dto.emergencyPhone && { emergencyPhone: dto.emergencyPhone }),
          ...(dto.tenantMembershipId !== undefined && {
            tenantMembershipId: dto.tenantMembershipId,
          }),
        },
        timestamp: new Date().toISOString(),
      })}`,
    );

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, userId: string, id: string) {
    const parent = await this.prisma.parentProfile.findFirst({
      where: { id, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found.');
    }

    const studentCount = await this.prisma.studentParent.count({
      where: { parentProfileId: id },
    });

    if (studentCount > 0) {
      // Soft delete
      await this.prisma.parentProfile.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      this.logger.log(
        `Parent soft-deleted structure: ${JSON.stringify({
          action: 'SOFT_DELETE_PARENT',
          parentProfileId: id,
          tenantId,
          actorUserId: userId,
          timestamp: new Date().toISOString(),
        })}`,
      );
      return { message: 'Parent soft-deleted successfully.' };
    } else {
      // Hard delete
      await this.prisma.parentProfile.delete({ where: { id } });
      this.logger.log(
        `Parent hard-deleted structure: ${JSON.stringify({
          action: 'DELETE_PARENT',
          parentProfileId: id,
          tenantId,
          actorUserId: userId,
          timestamp: new Date().toISOString(),
        })}`,
      );
      return { message: 'Parent deleted successfully.' };
    }
  }

  private async validateMembershipLink(
    tenantId: string,
    tenantMembershipId: string,
    currentParentId?: string,
  ): Promise<void> {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: tenantMembershipId,
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'The specified membership ID does not belong to an active member of this tenant.',
      );
    }

    const alreadyLinked = await this.prisma.parentProfile.findFirst({
      where: {
        tenantId,
        tenantMembershipId,
        deletedAt: null,
        ...(currentParentId && { id: { not: currentParentId } }),
      },
    });

    if (alreadyLinked) {
      throw new ConflictException(
        'This membership is already linked to another parent profile in this tenant.',
      );
    }
  }

  private formatListItem(p: any) {
    const user = p.membership?.user ?? null;
    return {
      id: p.id,
      name: user ? `${user.firstName} ${user.lastName}` : null,
      email: user?.email ?? null,
      emergencyPhone: p.emergencyPhone,
      studentCount: p._count.students,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
    };
  }

  private formatDetail(p: any) {
    const user = p.membership?.user ?? null;
    return {
      id: p.id,
      name: user ? `${user.firstName} ${user.lastName}` : null,
      email: user?.email ?? null,
      membershipId: p.tenantMembershipId,
      emergencyPhone: p.emergencyPhone,
      audit: {
        createdBy: p.creator
          ? {
              id: p.creator.id,
              name: `${p.creator.firstName} ${p.creator.lastName}`,
            }
          : null,
        createdAt: p.createdAt,
        updatedBy: p.updater
          ? {
              id: p.updater.id,
              name: `${p.updater.firstName} ${p.updater.lastName}`,
            }
          : null,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
      },
      students: (p.students ?? []).map((sp: any) => ({
        studentProfileId: sp.studentProfileId,
        relationship: sp.relationship,
        relationshipDescription: sp.relationshipDescription,
        studentName: sp.student?.membership?.user
          ? `${sp.student.membership.user.firstName} ${sp.student.membership.user.lastName}`
          : null,
        studentEmail: sp.student?.membership?.user?.email ?? null,
        rollNumber: sp.student?.rollNumber ?? null,
      })),
    };
  }
}
