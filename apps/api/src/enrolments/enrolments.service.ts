import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { CreateEnrolmentDto, UpdateEnrolmentDto } from './dto';

@Injectable()
export class EnrolmentsService {
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
        deletedAt: null,
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
      where: { id, tenantId, deletedAt: null },
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
        _count: {
          select: {
            enrolments: { where: { status: 'ACTIVE', deletedAt: null } },
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

    // 3. Capacity check
    if (cls._count.enrolments >= cls.maxCapacity) {
      throw new BadRequestException(
        `This class is at full capacity (${cls.maxCapacity} students). Cannot enrol more students.`,
      );
    }

    // 4. Duplicate check — student already enrolled in this class
    const existing = await this.prisma.enrolment.findFirst({
      where: {
        studentProfileId: dto.studentProfileId,
        classId: dto.classId,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        'This student is already enrolled in this class.',
      );
    }

    // 5. Create
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

    return this.findOne(tenantId, enrolment.id);
  }

  // ---------------------------------------------------------------------------
  // UPDATE — change enrolment status (ACTIVE → WITHDRAWN | COMPLETED)
  // ---------------------------------------------------------------------------
  async update(tenantId: string, id: string, dto: UpdateEnrolmentDto) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!enrolment) throw new NotFoundException('Enrolment not found.');

    if (!dto.status) return this.findOne(tenantId, id);

    await this.prisma.enrolment.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // WITHDRAW (soft-delete equivalent via status) — dedicated endpoint
  // ---------------------------------------------------------------------------
  async withdraw(tenantId: string, id: string) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!enrolment) throw new NotFoundException('Enrolment not found.');

    if (enrolment.status === 'WITHDRAWN') {
      throw new BadRequestException('This enrolment is already withdrawn.');
    }

    await this.prisma.enrolment.update({
      where: { id },
      data: { status: 'WITHDRAWN', deletedAt: new Date() },
    });

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
