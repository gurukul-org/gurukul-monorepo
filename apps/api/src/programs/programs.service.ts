import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

import { CreateProgramDto, UpdateProgramDto } from './dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    query?: { search?: string; status?: string },
  ) {
    const whereClause: Prisma.ProgramWhereInput = { tenantId };

    if (query?.status === 'archived') {
      whereClause.deletedAt = { not: null };
    } else if (query?.status === 'active') {
      whereClause.deletedAt = null;
    } else {
      // Default: non-archived programs
      whereClause.deletedAt = null;
    }

    if (query?.search) {
      const search = query.search.trim();
      if (search) {
        whereClause.AND = [
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        ];
      }
    }

    const programs = await this.prisma.program.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courses: {
          where: { deletedAt: null },
        },
        classes: {
          where: { deletedAt: null },
          include: {
            enrolments: {
              where: {
                status: 'ACTIVE',
                deletedAt: null,
              },
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return programs.map((program) => {
      const courseCount = program.courses.length;
      const activeEnrollmentCount = program.classes.reduce((sum, cls) => {
        return sum + cls.enrolments.length;
      }, 0);

      return {
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        courseCount,
        activeEnrollmentCount,
        createdBy: program.creator
          ? `${program.creator.firstName} ${program.creator.lastName}`
          : null,
        updatedBy: program.updater
          ? `${program.updater.firstName} ${program.updater.lastName}`
          : null,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
        deletedAt: program.deletedAt,
      };
    });
  }

  async findOne(tenantId: string, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        courses: {
          where: { deletedAt: null },
        },
        classes: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: {
                enrolments: {
                  where: { status: 'ACTIVE', deletedAt: null },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const totalEnrollmentCount = program.classes.reduce((sum, cls) => {
      return sum + cls._count.enrolments;
    }, 0);

    const coursesWithDetails = program.courses.map((course) => {
      // In this system, students in a section take all courses under that program.
      // So active enrollment for each course is equal to the total enrollment of the program.
      return {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        credits: course.credits,
        createdAt: course.createdAt,
        activeEnrollmentCount: totalEnrollmentCount,
      };
    });

    return {
      id: program.id,
      name: program.name,
      code: program.code,
      description: program.description,
      courses: coursesWithDetails,
      totalEnrollmentCount,
      createdBy: program.creator
        ? `${program.creator.firstName} ${program.creator.lastName}`
        : null,
      updatedBy: program.updater
        ? `${program.updater.firstName} ${program.updater.lastName}`
        : null,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      deletedAt: program.deletedAt,
    };
  }

  async create(tenantId: string, userId: string, dto: CreateProgramDto) {
    // Unique check within tenant (across active and archived)
    const existingCode = await this.prisma.program.findFirst({
      where: {
        tenantId,
        code: dto.code,
      },
    });

    if (existingCode) {
      throw new BadRequestException(
        'Program code already exists in this tenant.',
      );
    }

    return this.prisma.program.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateProgramDto,
  ) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Changing code requires confirmation and checks uniqueness
    if (dto.code && dto.code !== program.code) {
      const existingCode = await this.prisma.program.findFirst({
        where: {
          tenantId,
          code: dto.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new BadRequestException(
          'Program code already exists in this tenant.',
        );
      }

      if (!dto.ignoreWarnings) {
        const courseCount = await this.prisma.course.count({
          where: { programId: id },
        });

        if (courseCount > 0) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Warning',
            message: 'CODE_CHANGE_WARNING',
            details: `This program has ${courseCount} course(s). Changing the program code may affect downstream references.`,
          });
        } else {
          throw new BadRequestException({
            statusCode: 400,
            error: 'Warning',
            message: 'CODE_CHANGE_WARNING',
            details: `Are you sure you want to change the program code to "${dto.code}"?`,
          });
        }
      }
    }

    return this.prisma.program.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description:
          dto.description !== undefined ? dto.description : undefined,
        updatedBy: userId,
      },
    });
  }

  async archive(tenantId: string, userId: string, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return this.prisma.program.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async remove(tenantId: string, userId: string, id: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Hard-delete is only allowed if the program has zero courses, active or archived.
    const courseCount = await this.prisma.course.count({
      where: { programId: id },
    });

    if (courseCount > 0) {
      throw new BadRequestException(
        'Cannot hard-delete a program with courses associated with it.',
      );
    }

    return this.prisma.program.delete({
      where: { id },
    });
  }

  async validateProgramForCourseAddition(tenantId: string, programId: string) {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, tenantId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.deletedAt) {
      throw new BadRequestException(
        'Cannot add courses to an archived program',
      );
    }
  }
}
