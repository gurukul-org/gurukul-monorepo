import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'nestjs-prisma';

import { EmailService } from '../../email/email.service';
import {
  AcceptInvitationDto,
  InviteUserDto,
  ValidateInvitationResponseDto,
} from './dto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async inviteUser(
    dto: InviteUserDto,
    tenantId: string,
    inviterId: string,
    inviterScopes: string[] = [],
    isAdmin = false,
  ): Promise<{ message: string }> {
    // 1. Validate roles belong to tenant or are system roles
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: dto.roleIds },
        OR: [{ tenantId }, { isSystemRole: true }],
      },
    });

    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException(
        'One or more selected roles are invalid for this tenant.',
      );
    }

    // Role-specific permission gates
    const roleNames = roles.map((r) => r.name.toLowerCase());
    const isStudent = roleNames.includes('student');
    const isParent = roleNames.includes('parent');

    if (!isAdmin) {
      if (isStudent && !inviterScopes.includes('invite-students')) {
        throw new ForbiddenException(
          'You do not have permission to invite students.',
        );
      }
      if (isParent && !inviterScopes.includes('invite-parents')) {
        throw new ForbiddenException(
          'You do not have permission to invite parents.',
        );
      }
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        memberships: {
          where: { tenantId },
        },
      },
    });

    let invitedMembershipId: string | null = null;
    let removedMembershipId: string | null = null;

    if (existingUser && existingUser.memberships.length > 0) {
      const membership = existingUser.memberships[0];
      if (membership.status === 'INVITED') {
        invitedMembershipId = membership.id;
      } else if (
        membership.status === 'REMOVED' ||
        membership.deletedAt !== null
      ) {
        removedMembershipId = membership.id;
      } else {
        throw new ConflictException('User is already a member of this tenant.');
      }
    }

    const token = randomBytes(32).toString('hex');
    const invitationTokenHash = this.hashToken(token);
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.$transaction(async (prisma) => {
      let userId = existingUser?.id;

      if (!userId) {
        // Create placeholder user
        const tempPassword = randomBytes(16).toString('hex') + 'A1!'; // ensure constraints
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const newUser = await prisma.user.create({
          data: {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            passwordHash,
          },
        });
        userId = newUser.id;
      }

      let membershipId: string;

      if (invitedMembershipId) {
        // Reuse invited membership - update token and expire
        await prisma.tenantMembership.update({
          where: { id: invitedMembershipId },
          data: {
            invitedById: inviterId,
            invitationTokenHash,
            invitationExpiresAt,
          },
        });
        membershipId = invitedMembershipId;

        // Clean and re-assign roles
        await prisma.membershipRole.deleteMany({
          where: { tenantMembershipId: membershipId },
        });
      } else if (removedMembershipId) {
        await prisma.tenantMembership.update({
          where: { id: removedMembershipId },
          data: {
            status: 'INVITED',
            invitedById: inviterId,
            invitationTokenHash,
            invitationExpiresAt,
            deletedAt: null,
            joinedAt: null,
          },
        });
        membershipId = removedMembershipId;

        // Clean any residual roles
        await prisma.membershipRole.deleteMany({
          where: { tenantMembershipId: membershipId },
        });
      } else {
        const membership = await prisma.tenantMembership.create({
          data: {
            userId,
            tenantId,
            status: 'INVITED',
            invitedById: inviterId,
            invitationTokenHash,
            invitationExpiresAt,
          },
        });
        membershipId = membership.id;
      }

      // Assign roles
      if (dto.roleIds.length > 0) {
        const membershipRolesData = dto.roleIds.map((roleId) => ({
          tenantMembershipId: membershipId,
          roleId,
          assignedById: inviterId,
        }));
        await prisma.membershipRole.createMany({
          data: membershipRolesData,
        });
      }

      // Profile Pre-creation & Reuse
      if (isStudent) {
        // Check if student profile already linked
        const existingStudent = await prisma.studentProfile.findFirst({
          where: { tenantId, tenantMembershipId: membershipId },
        });

        let studentId = existingStudent?.id;

        if (existingStudent) {
          // Update profile fields
          await prisma.studentProfile.update({
            where: { id: existingStudent.id },
            data: {
              ...(dto.rollNumber && { rollNumber: dto.rollNumber }),
              ...(dto.admissionDate && {
                admissionDate: new Date(dto.admissionDate),
              }),
              updatedBy: inviterId,
              deletedAt: null,
            },
          });
        } else {
          // Create StudentProfile with temp placeholders if roll number is not provided
          const roll = dto.rollNumber || 'TEMP-' + membershipId.slice(0, 8);
          const admission = dto.admissionDate
            ? new Date(dto.admissionDate)
            : new Date();

          // Ensure roll number unique check
          const duplicate = await prisma.studentProfile.findFirst({
            where: { tenantId, rollNumber: roll, deletedAt: null },
          });
          if (duplicate) {
            throw new ConflictException(
              `Student roll number "${roll}" is already in use.`,
            );
          }

          const student = await prisma.studentProfile.create({
            data: {
              tenantId,
              tenantMembershipId: membershipId,
              rollNumber: roll,
              admissionDate: admission,
              status: 'ACTIVE',
              createdBy: inviterId,
              updatedBy: inviterId,
            },
          });
          studentId = student.id;
        }

        // Link Parents if preLinkedParentIds are provided
        if (dto.preLinkedParentIds && dto.preLinkedParentIds.length > 0) {
          // Remove existing links to prevent duplicates
          await prisma.studentParent.deleteMany({
            where: { studentProfileId: studentId },
          });

          const links = dto.preLinkedParentIds.map((parentId) => ({
            studentProfileId: studentId!,
            parentProfileId: parentId,
            relationship: 'GUARDIAN', // default
          }));
          await prisma.studentParent.createMany({ data: links });
        }
      }

      if (isParent) {
        const existingParent = await prisma.parentProfile.findFirst({
          where: { tenantId, tenantMembershipId: membershipId },
        });

        let parentId = existingParent?.id;

        if (existingParent) {
          await prisma.parentProfile.update({
            where: { id: existingParent.id },
            data: {
              ...(dto.emergencyPhone && {
                emergencyPhone: dto.emergencyPhone,
              }),
              updatedBy: inviterId,
              deletedAt: null,
            },
          });
        } else {
          const phone = dto.emergencyPhone || 'TEMP-PHONE';
          const parent = await prisma.parentProfile.create({
            data: {
              tenantId,
              tenantMembershipId: membershipId,
              emergencyPhone: phone,
              createdBy: inviterId,
              updatedBy: inviterId,
            },
          });
          parentId = parent.id;
        }

        // Link Students if preLinkedStudentIds are provided
        if (dto.preLinkedStudentIds && dto.preLinkedStudentIds.length > 0) {
          await prisma.studentParent.deleteMany({
            where: { parentProfileId: parentId },
          });

          const links = dto.preLinkedStudentIds.map((studentId) => ({
            studentProfileId: studentId,
            parentProfileId: parentId!,
            relationship: 'GUARDIAN', // default
          }));
          await prisma.studentParent.createMany({ data: links });
        }
      }
    });

    const inviteLink = this.buildInvitationUrl(token);
    try {
      await this.emailService.sendInvitationEmail(
        dto.email,
        tenant.name,
        `${inviter?.firstName} ${inviter?.lastName}`.trim() ||
          'An administrator',
        roles.map((r) => r.name),
        inviteLink,
      );
    } catch (error) {
      console.error('--- Error sending invitation email ---');
      console.error(error);
    }

    this.logger.log(
      `Invitation created structure: ${JSON.stringify({
        action: 'INVITE_USER',
        tenantId,
        inviterId,
        recipientEmail: dto.email,
        roles: roles.map((r) => r.name),
      })}`,
    );

    return { message: 'Invitation sent successfully.' };
  }

  async validateInvitation(
    token: string,
  ): Promise<ValidateInvitationResponseDto> {
    const invitationTokenHash = this.hashToken(token);

    const membership = await this.prisma.tenantMembership.findUnique({
      where: { invitationTokenHash },
      include: {
        tenant: true,
        user: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (
      !membership ||
      membership.status !== 'INVITED' ||
      membership.deletedAt
    ) {
      throw new BadRequestException('Invalid or cancelled invitation.');
    }

    if (
      membership.invitationExpiresAt &&
      membership.invitationExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'This invitation has expired. Please contact your administrator.',
      );
    }

    // Determine if the user is a placeholder (newly created) or an existing user.
    const activeMemberships = await this.prisma.tenantMembership.count({
      where: { userId: membership.userId, status: 'ACTIVE' },
    });

    const requiresPasswordSetup = activeMemberships === 0;

    // Find pre-filled student or parent profile details
    let rollNumber: string | undefined;
    let admissionDate: string | undefined;
    let emergencyPhone: string | undefined;
    let preLinkedParentCount: number | undefined;
    let preLinkedStudentCount: number | undefined;

    const roleNames = membership.roles.map((mr) => mr.role.name.toLowerCase());
    if (roleNames.includes('student')) {
      const student = await this.prisma.studentProfile.findFirst({
        where: {
          tenantId: membership.tenantId,
          tenantMembershipId: membership.id,
        },
        include: { _count: { select: { parents: true } } },
      });
      if (student && !student.rollNumber.startsWith('TEMP-')) {
        rollNumber = student.rollNumber;
        admissionDate = student.admissionDate.toISOString().split('T')[0];
      }
      if (student) {
        preLinkedParentCount = student._count.parents;
      }
    }

    if (roleNames.includes('parent')) {
      const parent = await this.prisma.parentProfile.findFirst({
        where: {
          tenantId: membership.tenantId,
          tenantMembershipId: membership.id,
        },
        include: { _count: { select: { students: true } } },
      });
      if (parent && parent.emergencyPhone !== 'TEMP-PHONE') {
        emergencyPhone = parent.emergencyPhone;
      }
      if (parent) {
        preLinkedStudentCount = parent._count.students;
      }
    }

    return {
      tenantName: membership.tenant.name,
      email: membership.user.email,
      roles: membership.roles.map((mr) => mr.role.name),
      requiresPasswordSetup,
      rollNumber,
      admissionDate,
      emergencyPhone,
      preLinkedParentCount,
      preLinkedStudentCount,
    };
  }

  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    const invitationTokenHash = this.hashToken(dto.token);

    const membership = await this.prisma.tenantMembership.findUnique({
      where: { invitationTokenHash },
      include: { user: true },
    });

    if (
      !membership ||
      membership.status !== 'INVITED' ||
      membership.deletedAt
    ) {
      throw new BadRequestException('Invalid or cancelled invitation.');
    }

    if (
      membership.invitationExpiresAt &&
      membership.invitationExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'This invitation has expired. Please contact your administrator.',
      );
    }

    const activeMemberships = await this.prisma.tenantMembership.count({
      where: { userId: membership.userId, status: 'ACTIVE' },
    });
    const requiresPasswordSetup = activeMemberships === 0;

    if (requiresPasswordSetup && !dto.password) {
      throw new BadRequestException(
        'Password is required to complete account setup.',
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      // Update membership
      await prisma.tenantMembership.update({
        where: { id: membership.id },
        data: {
          status: 'ACTIVE',
          invitationTokenHash: null,
          invitationExpiresAt: null,
          joinedAt: new Date(),
        },
      });

      // Set password if required
      if (requiresPasswordSetup && dto.password) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await prisma.user.update({
          where: { id: membership.userId },
          data: { passwordHash },
        });
      }

      // Finalize profiles
      const membershipRoles = await prisma.membershipRole.findMany({
        where: { tenantMembershipId: membership.id },
        include: { role: true },
      });
      const roleNames = membershipRoles.map((mr) => mr.role.name.toLowerCase());

      if (roleNames.includes('student')) {
        const student = await prisma.studentProfile.findFirst({
          where: {
            tenantId: membership.tenantId,
            tenantMembershipId: membership.id,
          },
        });

        const roll =
          dto.rollNumber ||
          (student && !student.rollNumber.startsWith('TEMP-')
            ? student.rollNumber
            : undefined);
        const admission = dto.admissionDate
          ? new Date(dto.admissionDate)
          : student
            ? student.admissionDate
            : undefined;

        if (!roll || !admission) {
          throw new BadRequestException(
            'Student roll number and admission date are required to complete setup.',
          );
        }

        if (student) {
          // Check roll number uniqueness if changed
          if (roll !== student.rollNumber) {
            const duplicate = await prisma.studentProfile.findFirst({
              where: {
                tenantId: membership.tenantId,
                rollNumber: roll,
                deletedAt: null,
                id: { not: student.id },
              },
            });
            if (duplicate) {
              throw new ConflictException(
                `Student roll number "${roll}" is already in use.`,
              );
            }
          }

          await prisma.studentProfile.update({
            where: { id: student.id },
            data: {
              rollNumber: roll,
              admissionDate: admission,
              updatedBy: membership.userId,
            },
          });
        } else {
          // Ensure roll number unique check
          const duplicate = await prisma.studentProfile.findFirst({
            where: {
              tenantId: membership.tenantId,
              rollNumber: roll,
              deletedAt: null,
            },
          });
          if (duplicate) {
            throw new ConflictException(
              `Student roll number "${roll}" is already in use.`,
            );
          }

          await prisma.studentProfile.create({
            data: {
              tenantId: membership.tenantId,
              tenantMembershipId: membership.id,
              rollNumber: roll,
              admissionDate: admission,
              status: 'ACTIVE',
              createdBy: membership.userId,
              updatedBy: membership.userId,
            },
          });
        }
      }

      if (roleNames.includes('parent')) {
        const parent = await prisma.parentProfile.findFirst({
          where: {
            tenantId: membership.tenantId,
            tenantMembershipId: membership.id,
          },
        });

        const phone =
          dto.emergencyPhone ||
          (parent && parent.emergencyPhone !== 'TEMP-PHONE'
            ? parent.emergencyPhone
            : undefined);

        if (!phone) {
          throw new BadRequestException(
            'Parent emergency phone number is required to complete setup.',
          );
        }

        if (parent) {
          await prisma.parentProfile.update({
            where: { id: parent.id },
            data: {
              emergencyPhone: phone,
              updatedBy: membership.userId,
            },
          });
        } else {
          await prisma.parentProfile.create({
            data: {
              tenantId: membership.tenantId,
              tenantMembershipId: membership.id,
              emergencyPhone: phone,
              createdBy: membership.userId,
              updatedBy: membership.userId,
            },
          });
        }
      }
    });

    return { message: 'Invitation accepted successfully.' };
  }

  async resendInvitation(
    membershipId: string,
    tenantId: string,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { id: membershipId },
      include: {
        user: true,
        tenant: true,
        invitedBy: true,
        roles: { include: { role: true } },
      },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Invitation not found.');
    }

    if (membership.status !== 'INVITED') {
      throw new BadRequestException('Only pending invitations can be resent.');
    }

    const token = randomBytes(32).toString('hex');
    const invitationTokenHash = this.hashToken(token);
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.tenantMembership.update({
      where: { id: membership.id },
      data: {
        invitationTokenHash,
        invitationExpiresAt,
        updatedAt: new Date(),
      },
    });

    const inviteLink = this.buildInvitationUrl(token);
    await this.emailService.sendInvitationEmail(
      membership.user.email,
      membership.tenant.name,
      `${membership.invitedBy?.firstName} ${membership.invitedBy?.lastName}`.trim() ||
        'An administrator',
      membership.roles.map((r) => r.role.name),
      inviteLink,
    );

    this.logger.log(
      `Invitation resent structure: ${JSON.stringify({
        action: 'RESEND_INVITATION',
        tenantId,
        membershipId,
        recipientEmail: membership.user.email,
        invitedById: membership.invitedById,
        roles: membership.roles.map((r) => r.role.name),
      })}`,
    );

    return { message: 'Invitation resent successfully.' };
  }

  async cancelInvitation(
    membershipId: string,
    tenantId: string,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Invitation not found.');
    }

    if (membership.status !== 'INVITED') {
      throw new BadRequestException(
        'Only pending invitations can be cancelled.',
      );
    }

    const userId = membership.userId;

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete matching assigned roles
      await tx.membershipRole.deleteMany({
        where: { tenantMembershipId: membershipId },
      });

      // 2. Delete the membership row
      await tx.tenantMembership.delete({
        where: { id: membershipId },
      });

      // 3. Count other memberships for the user across all tenants
      const otherMembershipsCount = await tx.tenantMembership.count({
        where: { userId },
      });

      // 4. If the user has no other memberships left, delete the user row
      if (otherMembershipsCount === 0) {
        await tx.user.delete({
          where: { id: userId },
        });
      }
    });

    this.logger.log(
      `Invitation cancelled structure: ${JSON.stringify({
        action: 'CANCEL_INVITATION',
        tenantId,
        membershipId,
        recipientEmail: membership.user.email,
      })}`,
    );

    return { message: 'Invitation cancelled successfully.' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildInvitationUrl(token: string): string {
    const baseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = new URL(`${baseUrl}/invitations/accept`);
    url.searchParams.set('token', token);
    return url.toString();
  }
}
