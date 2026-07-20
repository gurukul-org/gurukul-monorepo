import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { TEACHER_STATUS, TeacherStatus } from './teachers.constants';

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
        // Only the system Teacher role — a custom tenant role someone happens to
        // name "teacher" must not leak its members into the directory.
        isSystemRole: true,
      },
    },
  },
};

// Hard upper bound on page size so `?limit=100000` can't fetch the whole table.
const MAX_LIMIT = 100;

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    search?: string,
    status?: string,
    limit = 20,
    cursor?: string,
  ) {
    const take = Math.min(limit > 0 ? limit : 20, MAX_LIMIT);

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

    const statusFilter = status
      ? status.includes(',')
        ? { status: { in: status.split(',') } }
        : TEACHER_STATUS[status as TeacherStatus]
          ? { status }
          : {}
      : {};

    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...TEACHER_ROLE_FILTER,
        ...statusFilter,
        ...searchFilter,
      },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      // firstName is non-unique — add id as a tiebreaker so cursor pagination has
      // a deterministic total order and can't skip or duplicate rows across pages.
      orderBy: [{ user: { firstName: 'asc' } }, { id: 'asc' }],
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
        deletedAt: null,
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
