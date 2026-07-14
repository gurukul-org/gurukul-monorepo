import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { AssignInstructorDto } from './dto';

@Injectable()
export class InstructorsService {
  private readonly logger = new Logger(InstructorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. List all active eligible instructors for a tenant
  async findAllEligible(tenantId: string) {
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
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    const eligible = memberships.filter((m) => {
      return m.roles.some((mr) => {
        const roleName = mr.role.name.toLowerCase();
        if (roleName === 'faculty') return true;
        if (mr.role.isAdmin) return true;
        return mr.role.permissions.some(
          (p) => p.permissionId === 'view-own-classes',
        );
      });
    });

    return eligible.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
    }));
  }

  // 2. Assign an instructor to a class
  async assignInstructor(
    tenantId: string,
    classId: string,
    userId: string,
    dto: AssignInstructorDto,
  ) {
    // A. Verify class exists
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, tenantId, deletedAt: null },
    });
    if (!cls) throw new NotFoundException('Class not found.');

    // B. Verify membership exists and is active
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        id: dto.tenantMembershipId,
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: true },
            },
          },
        },
      },
    });
    if (!membership)
      throw new NotFoundException('Member not found or inactive.');

    // C. Verify instructor eligibility
    const isEligible = membership.roles.some((mr) => {
      const roleName = mr.role.name.toLowerCase();
      if (roleName === 'faculty') return true;
      if (mr.role.isAdmin) return true;
      return mr.role.permissions.some(
        (p) => p.permissionId === 'view-own-classes',
      );
    });
    if (!isEligible) {
      throw new BadRequestException(
        'This member is not eligible to be assigned as an instructor.',
      );
    }

    // D. Verify not already assigned
    const existing = await this.prisma.classInstructor.findFirst({
      where: {
        classId,
        tenantMembershipId: dto.tenantMembershipId,
      },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        'This instructor is already assigned to this class.',
      );
    }

    // E. Determine if primary instructor
    let isPrimary = !!dto.isPrimary;

    // Check if this class has any active instructors
    const currentInstructors = await this.prisma.classInstructor.findMany({
      where: { classId, deletedAt: null },
    });

    if (currentInstructors.length === 0) {
      // First instructor MUST be primary
      isPrimary = true;
    }

    // F. If isPrimary is true, demote other primary
    const assigned = await this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.classInstructor.updateMany({
          where: { classId, isPrimary: true, deletedAt: null },
          data: { isPrimary: false },
        });
      }

      if (existing) {
        // Restore soft-deleted record
        return tx.classInstructor.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            isPrimary,
            assignedById: userId,
          },
        });
      }

      return tx.classInstructor.create({
        data: {
          tenantId,
          classId,
          tenantMembershipId: dto.tenantMembershipId,
          isPrimary,
          assignedById: userId,
        },
      });
    });

    this.logger.log(
      JSON.stringify({
        action: 'ASSIGN_INSTRUCTOR',
        classId,
        tenantMembershipId: dto.tenantMembershipId,
        isPrimary,
        actorUserId: userId,
        tenantId,
        timestamp: new Date().toISOString(),
      }),
    );

    return assigned;
  }

  // 3. Promote secondary to primary (demotes current primary)
  async promoteToPrimary(
    tenantId: string,
    classId: string,
    userId: string,
    id: string,
  ) {
    const assignment = await this.prisma.classInstructor.findFirst({
      where: { id, classId, tenantId, deletedAt: null },
    });
    if (!assignment)
      throw new NotFoundException('Instructor assignment not found.');

    if (assignment.isPrimary) {
      return assignment;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Demote current primary
      await tx.classInstructor.updateMany({
        where: { classId, isPrimary: true, deletedAt: null },
        data: { isPrimary: false },
      });

      // Promote this one
      return tx.classInstructor.update({
        where: { id },
        data: { isPrimary: true },
      });
    });

    this.logger.log(
      JSON.stringify({
        action: 'UPDATE_PRIMARY_INSTRUCTOR',
        classId,
        newPrimaryInstructorId: id,
        actorUserId: userId,
        tenantId,
        timestamp: new Date().toISOString(),
      }),
    );

    return updated;
  }

  // 4. Remove instructor from class
  async removeInstructor(
    tenantId: string,
    classId: string,
    userId: string,
    id: string,
  ) {
    const assignment = await this.prisma.classInstructor.findFirst({
      where: { id, classId, tenantId, deletedAt: null },
    });
    if (!assignment)
      throw new NotFoundException('Instructor assignment not found.');

    // Count remaining active instructors
    const otherInstructors = await this.prisma.classInstructor.findMany({
      where: {
        classId,
        id: { not: id },
        deletedAt: null,
      },
    });

    if (assignment.isPrimary && otherInstructors.length > 0) {
      throw new BadRequestException(
        'Please designate another instructor as primary first before removing this one.',
      );
    }

    await this.prisma.classInstructor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(
      JSON.stringify({
        action: 'REMOVE_INSTRUCTOR',
        classId,
        classInstructorId: id,
        actorUserId: userId,
        tenantId,
        timestamp: new Date().toISOString(),
      }),
    );

    return { message: 'Instructor removed from class successfully.' };
  }

  async getOptions(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      status: 'ACTIVE',
      deletedAt: null,
      roles: {
        some: {
          role: {
            OR: [
              { name: { mode: 'insensitive', equals: 'faculty' } },
              { isAdmin: true },
              { permissions: { some: { permissionId: 'view-own-classes' } } },
            ],
          },
        },
      },
    };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.tenantMembership.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          user: {
            firstName: 'asc',
          },
        },
      }),
      this.prisma.tenantMembership.count({ where }),
    ]);

    return {
      items: items.map((m) => ({
        value: m.id,
        label: `${m.user.firstName} ${m.user.lastName}`,
      })),
      hasMore: skip + items.length < total,
      total,
    };
  }
}
