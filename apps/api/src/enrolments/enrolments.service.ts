import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import {
  BulkCreateEnrolmentDto,
  CreateEnrolmentDto,
  UpdateEnrolmentDto,
} from './dto';

@Injectable()
export class EnrolmentsService {
  private readonly logger = new Logger(EnrolmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // LIST — all enrolments for a tenant, filterable by student or class
  // ---------------------------------------------------------------------------
  async findAll(
    tenantId: string,
    filters: { studentProfileId?: string; classId?: string; status?: string },
  ) {
    const enrolments = await this.prisma.enrolment.findMany({
      where: {
        tenantId,
        studentProfileId: filters.studentProfileId || undefined,
        classId: filters.classId || undefined,
        status: filters.status || undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            status: true,
            membership: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            maxCapacity: true,
            status: true,
            program: { select: { id: true, name: true, code: true } },
            academicTerm: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrolments.map((e) => this.format(e));
  }

  // ---------------------------------------------------------------------------
  // DETAIL
  // ---------------------------------------------------------------------------
  async findOne(tenantId: string, id: string) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id, tenantId },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            status: true,
            membership: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            maxCapacity: true,
            status: true,
            program: { select: { id: true, name: true, code: true } },
            academicTerm: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!enrolment) throw new NotFoundException('Enrolment not found.');
    return this.format(enrolment);
  }

  // ---------------------------------------------------------------------------
  // ENROL — create enrolment with all safety guards
  // ---------------------------------------------------------------------------
  async create(tenantId: string, userId: string, dto: CreateEnrolmentDto) {
    // 1. Student must exist and be ACTIVE in this tenant
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentProfileId, tenantId, deletedAt: null },
    });
    if (!student) {
      throw new NotFoundException('Student not found in this tenant.');
    }
    if (student.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot enrol a student with status "${student.status}". Only ACTIVE students can be enrolled.`,
      );
    }

    // 2. Class must exist, belong to this tenant, and be ACTIVE
    const cls = await this.prisma.class.findFirst({
      where: { id: dto.classId, tenantId, deletedAt: null },
      include: {
        academicTerm: { select: { id: true, deletedAt: true, isActive: true } },
        _count: {
          select: {
            enrolments: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });
    if (!cls) {
      throw new NotFoundException('Class not found in this tenant.');
    }
    if (cls.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot enrol into a class with status "${cls.status}". Only ACTIVE classes accept enrolments.`,
      );
    }

    // 3. Academic term must not be archived
    if (cls.academicTerm.deletedAt !== null) {
      throw new BadRequestException(
        'Cannot enrol into a class whose academic term has been archived.',
      );
    }

    // 4. Capacity check
    if (cls._count.enrolments >= cls.maxCapacity) {
      throw new BadRequestException(
        `This class is at full capacity (${cls.maxCapacity} students). Cannot enrol more students.`,
      );
    }

    // 5. Duplicate check — student must not already have an ACTIVE enrolment in this class
    const existing = await this.prisma.enrolment.findFirst({
      where: {
        studentProfileId: dto.studentProfileId,
        classId: dto.classId,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      throw new ConflictException(
        'This student already has an active enrolment in this class.',
      );
    }

    // 6. Create
    const enrolment = await this.prisma.enrolment.create({
      data: {
        tenantId,
        studentProfileId: dto.studentProfileId,
        classId: dto.classId,
        status: 'ACTIVE',
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
        createdBy: userId,
      },
    });

    this.logger.log(
      JSON.stringify({
        action: 'CREATE_ENROLMENT',
        enrolmentId: enrolment.id,
        studentProfileId: dto.studentProfileId,
        classId: dto.classId,
        tenantId,
        actorUserId: userId,
        timestamp: new Date().toISOString(),
      }),
    );

    return this.findOne(tenantId, enrolment.id);
  }

  // ---------------------------------------------------------------------------
  // BULK ENROL — enrol multiple students into one class with partial success
  // ---------------------------------------------------------------------------
  async bulkCreate(
    tenantId: string,
    userId: string,
    dto: BulkCreateEnrolmentDto,
  ) {
    const results: {
      succeeded: { studentProfileId: string; enrolmentId: string }[];
      failed: { studentProfileId: string; reason: string }[];
    } = {
      succeeded: [],
      failed: [],
    };

    for (const studentProfileId of dto.studentProfileIds) {
      try {
        const enrolment = await this.create(tenantId, userId, {
          studentProfileId,
          classId: dto.classId,
          enrolledAt: dto.enrolledAt,
        });
        results.succeeded.push({
          studentProfileId,
          enrolmentId: enrolment.id,
        });
      } catch (error: any) {
        results.failed.push({
          studentProfileId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(
      JSON.stringify({
        action: 'BULK_CREATE_ENROLMENT',
        classId: dto.classId,
        tenantId,
        actorUserId: userId,
        succeeded: results.succeeded.length,
        failed: results.failed.length,
        timestamp: new Date().toISOString(),
      }),
    );

    return results;
  }

  // ---------------------------------------------------------------------------
  // UPDATE — change enrolment status with state-machine guards
  // ---------------------------------------------------------------------------
  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateEnrolmentDto,
  ) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id, tenantId },
    });
    if (!enrolment) throw new NotFoundException('Enrolment not found.');

    if (!dto.status) return this.findOne(tenantId, id);

    // State-machine guard: only ACTIVE enrolments can transition
    if (enrolment.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot change status from "${enrolment.status}". Only ACTIVE enrolments can be updated.`,
      );
    }

    const allowedTransitions = ['WITHDRAWN', 'COMPLETED'];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition. ACTIVE enrolments can only be changed to WITHDRAWN or COMPLETED.`,
      );
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'WITHDRAWN' && dto.withdrawReason) {
      updateData.withdrawReason = dto.withdrawReason;
    }

    await this.prisma.enrolment.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(
      JSON.stringify({
        action:
          dto.status === 'WITHDRAWN'
            ? 'WITHDRAW_ENROLMENT'
            : 'COMPLETE_ENROLMENT',
        enrolmentId: id,
        tenantId,
        actorUserId: userId,
        previousStatus: enrolment.status,
        newStatus: dto.status,
        withdrawReason: dto.withdrawReason || null,
        timestamp: new Date().toISOString(),
      }),
    );

    return this.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WITHDRAW — dedicated convenience endpoint
  // ---------------------------------------------------------------------------
  async withdraw(
    tenantId: string,
    userId: string,
    id: string,
    withdrawReason?: string,
  ) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id, tenantId },
    });
    if (!enrolment) throw new NotFoundException('Enrolment not found.');

    if (enrolment.status === 'WITHDRAWN') {
      throw new BadRequestException('This enrolment is already withdrawn.');
    }

    if (enrolment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot withdraw a completed enrolment.');
    }

    await this.prisma.enrolment.update({
      where: { id },
      data: {
        status: 'WITHDRAWN',
        withdrawReason: withdrawReason || null,
      },
    });

    this.logger.log(
      JSON.stringify({
        action: 'WITHDRAW_ENROLMENT',
        enrolmentId: id,
        tenantId,
        actorUserId: userId,
        withdrawReason: withdrawReason || null,
        timestamp: new Date().toISOString(),
      }),
    );

    return { message: 'Student withdrawn from class successfully.' };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE FORMAT
  // ---------------------------------------------------------------------------
  private format(e: any) {
    const user = e.student?.membership?.user ?? null;
    return {
      id: e.id,
      status: e.status,
      enrolledAt: e.enrolledAt,
      withdrawReason: e.withdrawReason ?? null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      student: {
        id: e.student.id,
        rollNumber: e.student.rollNumber,
        studentStatus: e.student.status,
        name: user ? `${user.firstName} ${user.lastName}` : null,
        email: user?.email ?? null,
      },
      class: {
        id: e.class.id,
        name: e.class.name,
        maxCapacity: e.class.maxCapacity,
        classStatus: e.class.status,
        program: e.class.program,
        academicTerm: e.class.academicTerm,
      },
    };
  }
}
