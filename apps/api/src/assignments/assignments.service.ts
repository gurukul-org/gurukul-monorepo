import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { MarkSubmissionDto } from './dto/mark-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    createdById: string,
    dto: CreateAssignmentDto,
  ) {
    // Verify class exists and belongs to tenant
    const targetClass = await this.prisma.class.findFirst({
      where: { id: dto.classId, tenantId },
    });
    if (!targetClass) {
      throw new NotFoundException('Class not found.');
    }

    return this.prisma.assignment.create({
      data: {
        tenantId,
        classId: dto.classId,
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        marks: dto.marks,
        questions: (dto.questions as any) ?? [], // JSON array of questions
        createdById,
      },
    });
  }

  async findAll(tenantId: string, membershipId: string, isStudent: boolean) {
    if (isStudent) {
      // Find the student profile for this membership
      const studentProfile = await this.prisma.studentProfile.findFirst({
        where: { tenantMembershipId: membershipId, tenantId },
      });
      if (!studentProfile) {
        return [];
      }

      // Find all classes this student is active in
      const activeEnrolments = await this.prisma.enrolment.findMany({
        where: {
          studentProfileId: studentProfile.id,
          status: 'ACTIVE',
          tenantId,
        },
        select: { classId: true },
      });
      const classIds = activeEnrolments.map((e) => e.classId);

      if (classIds.length === 0) {
        return [];
      }

      // Fetch assignments in those classes
      const assignments = await this.prisma.assignment.findMany({
        where: {
          classId: { in: classIds },
          tenantId,
          deletedAt: null,
        },
        include: {
          class: { select: { name: true } },
          submissions: {
            where: { studentProfileId: studentProfile.id },
            select: { id: true, status: true, score: true },
          },
        },
        orderBy: { endDate: 'asc' },
      });

      // Map status dynamically for frontend ease
      return assignments.map((assignment) => {
        const submission = assignment.submissions[0];
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          marks: assignment.marks,
          className: assignment.class.name,
          submissionStatus: submission
            ? submission.status === 'MARKED'
              ? 'Marked'
              : 'Submitted'
            : 'Not submitted',
          score: submission?.score ?? null,
        };
      });
    }

    // Teacher view - return all assignments in the tenant
    // Optionally restricted to classes taught by this teacher in the future,
    // but returning all is standard for this dashboard.
    const assignments = await this.prisma.assignment.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        class: { select: { name: true } },
        submissions: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      marks: assignment.marks,
      className: assignment.class.name,
      classId: assignment.classId,
      submissionCount: assignment.submissions.length,
    }));
  }

  async findOne(
    tenantId: string,
    id: string,
    membershipId?: string,
    isStudent?: boolean,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        class: { select: { name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    let submission: any = null;
    if (isStudent && membershipId) {
      const studentProfile = await this.prisma.studentProfile.findFirst({
        where: { tenantMembershipId: membershipId, tenantId },
      });
      if (studentProfile) {
        submission = await this.prisma.assignmentSubmission.findUnique({
          where: {
            assignmentId_studentProfileId: {
              assignmentId: id,
              studentProfileId: studentProfile.id,
            },
          },
          include: {
            markedBy: {
              select: { firstName: true, lastName: true },
            },
          },
        });
      }
    }

    return {
      ...assignment,
      submission,
    };
  }

  async delete(tenantId: string, id: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    // Soft delete
    return this.prisma.assignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async submit(
    tenantId: string,
    assignmentId: string,
    membershipId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    // Check deadline
    if (new Date() > new Date(assignment.endDate)) {
      throw new BadRequestException('Submission deadline has passed.');
    }

    // Fetch student profile
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: { tenantMembershipId: membershipId, tenantId },
    });
    if (!studentProfile) {
      throw new ForbiddenException('Student profile not found.');
    }

    // Verify enrollment
    const enrollment = await this.prisma.enrolment.findFirst({
      where: {
        studentProfileId: studentProfile.id,
        classId: assignment.classId,
        status: 'ACTIVE',
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not active in this class.');
    }

    // Save/upsert submission
    return this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentProfileId: {
          assignmentId,
          studentProfileId: studentProfile.id,
        },
      },
      update: {
        answers: dto.answers as any,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        tenantId,
        assignmentId,
        studentProfileId: studentProfile.id,
        answers: dto.answers as any,
        status: 'SUBMITTED',
      },
    });
  }

  async getSubmissions(tenantId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found.');
    }

    // Retrieve active students in the class
    const enrolments = await this.prisma.enrolment.findMany({
      where: { classId: assignment.classId, status: 'ACTIVE', tenantId },
      include: {
        student: {
          include: {
            membership: {
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
            },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    // Retrieve existing submissions
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId, tenantId },
    });

    const submissionMap = new Map(
      submissions.map((s) => [s.studentProfileId, s]),
    );

    // Merge student list with their submission status and details
    return enrolments.map((enrolment) => {
      const student = enrolment.student;
      const user = student.membership?.user;
      const sub = submissionMap.get(student.id);

      return {
        studentProfileId: student.id,
        rollNumber: student.rollNumber,
        firstName: user?.firstName ?? 'Unknown',
        lastName: user?.lastName ?? 'Student',
        email: user?.email ?? '',
        status: sub
          ? sub.status === 'MARKED'
            ? 'Marked'
            : 'Submitted'
          : 'Not submitted',
        submissionDetails: sub
          ? {
              id: sub.id,
              answers: sub.answers,
              score: sub.score,
              remarks: sub.remarks,
              submittedAt: sub.submittedAt,
              markedAt: sub.markedAt,
            }
          : null,
      };
    });
  }

  async mark(
    tenantId: string,
    submissionId: string,
    markedById: string,
    dto: MarkSubmissionDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, tenantId },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    if (dto.score > submission.assignment.marks) {
      throw new BadRequestException(
        `Score cannot exceed assignment maximum marks (${submission.assignment.marks}).`,
      );
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        remarks: dto.remarks,
        status: 'MARKED',
        markedById,
        markedAt: new Date(),
        ...(dto.answers ? { answers: dto.answers as any } : {}),
      },
    });
  }
}
