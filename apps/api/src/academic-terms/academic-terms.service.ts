import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { CreateAcademicTermDto, UpdateAcademicTermDto } from './dto';

@Injectable()
export class AcademicTermsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string) {
    const now = new Date();
    let whereClause: any = { tenantId };

    if (status === 'active') {
      whereClause = {
        ...whereClause,
        isActive: true,
        deletedAt: null,
      };
    } else if (status === 'upcoming') {
      whereClause = {
        ...whereClause,
        startDate: { gt: now },
        isActive: false,
        deletedAt: null,
      };
    } else if (status === 'past') {
      whereClause = {
        ...whereClause,
        endDate: { lt: now },
        isActive: false,
        deletedAt: null,
      };
    } else if (status === 'archived') {
      whereClause = {
        ...whereClause,
        deletedAt: { not: null },
      };
    } else {
      // Default: non-archived terms
      whereClause = {
        ...whereClause,
        deletedAt: null,
      };
    }

    const terms = await this.prisma.academicTerm.findMany({
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
        _count: {
          select: { classes: true },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return terms.map((term) => ({
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      isActive: term.isActive,
      classCount: term._count.classes,
      createdBy: term.creator
        ? `${term.creator.firstName} ${term.creator.lastName}`
        : null,
      updatedBy: term.updater
        ? `${term.updater.firstName} ${term.updater.lastName}`
        : null,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
      deletedAt: term.deletedAt,
    }));
  }

  async findOne(tenantId: string, id: string) {
    const term = await this.prisma.academicTerm.findFirst({
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
        _count: {
          select: { classes: true },
        },
      },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    return {
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      isActive: term.isActive,
      classCount: term._count.classes,
      createdBy: term.creator
        ? `${term.creator.firstName} ${term.creator.lastName}`
        : null,
      updatedBy: term.updater
        ? `${term.updater.firstName} ${term.updater.lastName}`
        : null,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
      deletedAt: term.deletedAt,
    };
  }

  async create(tenantId: string, userId: string, dto: CreateAcademicTermDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException('End date must be after the start date.');
    }

    // Check for overlap with another non-archived term
    const overlappingTerm = await this.prisma.academicTerm.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
    });

    if (overlappingTerm && !dto.ignoreWarnings) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Warning',
        message: 'OVERLAP_WARNING',
        details: `This term's dates overlap with another term: "${overlappingTerm.name}".`,
      });
    }

    return this.prisma.academicTerm.create({
      data: {
        tenantId,
        name: dto.name,
        startDate: start,
        endDate: end,
        isActive: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateAcademicTermDto,
  ) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    const start = dto.startDate
      ? new Date(dto.startDate)
      : new Date(term.startDate);
    const end = dto.endDate ? new Date(dto.endDate) : new Date(term.endDate);

    if (dto.startDate || dto.endDate) {
      if (end <= start) {
        throw new BadRequestException('End date must be after the start date.');
      }
    }

    const classCount = await this.prisma.class.count({
      where: { academicTermId: id },
    });

    // Edit any field on a term that has no scheduled classes.
    // Allow editing dates on a term with classes, but show a confirmation warning.
    if (
      classCount > 0 &&
      (dto.startDate || dto.endDate) &&
      !dto.ignoreWarnings
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Warning',
        message: 'HAS_CLASSES_WARNING',
        details: `This term has ${classCount} scheduled class(es). Changing its dates may affect course schedules.`,
      });
    }

    // Check for overlap if dates are updated
    if ((dto.startDate || dto.endDate) && !dto.ignoreWarnings) {
      const overlappingTerm = await this.prisma.academicTerm.findFirst({
        where: {
          tenantId,
          id: { not: id },
          deletedAt: null,
          AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
        },
      });

      if (overlappingTerm) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Warning',
          message: 'OVERLAP_WARNING',
          details: `This term's new dates overlap with another term: "${overlappingTerm.name}".`,
        });
      }
    }

    return this.prisma.academicTerm.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? start : undefined,
        endDate: dto.endDate ? end : undefined,
        updatedBy: userId,
      },
    });
  }

  async activate(tenantId: string, userId: string, id: string) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    // Check if another term is currently active
    const activeTerm = await this.prisma.academicTerm.findFirst({
      where: { tenantId, isActive: true, deletedAt: null },
    });

    if (activeTerm && activeTerm.id !== id) {
      throw new BadRequestException(
        `Another term ("${activeTerm.name}") is currently active. Please deactivate it first.`,
      );
    }

    return this.prisma.academicTerm.update({
      where: { id },
      data: {
        isActive: true,
        updatedBy: userId,
      },
    });
  }

  async deactivate(tenantId: string, userId: string, id: string) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    return this.prisma.academicTerm.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  async archive(tenantId: string, userId: string, id: string) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    // Soft delete
    return this.prisma.academicTerm.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  async remove(tenantId: string, userId: string, id: string) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    // Hard-delete only allowed if term has zero classes and zero enrollments referencing it
    const classCount = await this.prisma.class.count({
      where: { academicTermId: id },
    });

    const enrolmentCount = await this.prisma.enrolment.count({
      where: { class: { academicTermId: id } },
    });

    if (classCount > 0 || enrolmentCount > 0) {
      throw new BadRequestException(
        'Cannot hard-delete a term with classes or enrollments associated with it.',
      );
    }

    return this.prisma.academicTerm.delete({
      where: { id },
    });
  }
}
