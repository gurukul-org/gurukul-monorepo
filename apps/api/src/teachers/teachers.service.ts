import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const TEACHER_ROLE_FILTER = {
  roles: {
    some: {
      role: {
        name: { equals: 'Teacher', mode: 'insensitive' as const },
      },
    },
  },
};

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    search?: string,
    limit = 20,
    cursor?: string,
  ) {
    const take = limit > 0 ? limit : 20;

    const searchFilter = search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};

    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
        ...TEACHER_ROLE_FILTER,
        ...searchFilter,
      },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { user: { firstName: 'asc' } },
      include: { user: { select: USER_SELECT } },
    });

    const hasNextPage = memberships.length > take;
    if (hasNextPage) memberships.pop();
    const nextCursor = hasNextPage
      ? memberships[memberships.length - 1].id
      : null;

    return {
      teachers: memberships.map((m) => this.formatListItem(m)),
      nextCursor,
    };
  }

  async findOne(tenantId: string, membershipId: string) {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: membershipId,
        tenantId,
        ...TEACHER_ROLE_FILTER,
      },
      include: {
        user: { select: USER_SELECT },
        classInstructors: {
          where: { deletedAt: null },
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Teacher not found.');
    }

    return this.formatDetail(membership);
  }

  private formatListItem(m: any) {
    return {
      id: m.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      email: m.user.email,
      accountStatus: m.status,
      createdAt: m.createdAt,
    };
  }

  private formatDetail(m: any) {
    return {
      id: m.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      email: m.user.email,
      accountStatus: m.status,
      classes: (m.classInstructors ?? []).map((ci: any) => ({
        classId: ci.class.id,
        className: ci.class.name,
        isPrimary: ci.isPrimary,
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }
}
