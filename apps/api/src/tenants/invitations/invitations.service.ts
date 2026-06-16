import {
  BadRequestException,
  ConflictException,
  Injectable,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async inviteUser(
    dto: InviteUserDto,
    tenantId: string,
    inviterId: string,
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

    if (existingUser && existingUser.memberships.length > 0) {
      const membership = existingUser.memberships[0];
      if (membership.status === 'INVITED') {
        throw new ConflictException(
          'User is already invited to this tenant. You can resend the invitation.',
        );
      }
      throw new ConflictException('User is already a member of this tenant.');
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

      // Create membership
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

      // Assign roles
      if (dto.roleIds.length > 0) {
        const membershipRolesData = dto.roleIds.map((roleId) => ({
          tenantMembershipId: membership.id,
          roleId,
          assignedById: inviterId,
        }));
        await prisma.membershipRole.createMany({
          data: membershipRolesData,
        });
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
    // If the user has a temporary hash, we can infer they never logged in, but better is to check
    // if they have other active memberships or if we can rely on a flag.
    // Since we created them, they haven't set a password. We can assume if they only have this 1 membership and it's invited,
    // they need to set a password. A safer check is whether they've logged in before, but we can just require password if they haven't.
    // Let's assume a user with no other active memberships and no lastActiveAt needs password setup.
    const activeMemberships = await this.prisma.tenantMembership.count({
      where: { userId: membership.userId, status: 'ACTIVE' },
    });

    const requiresPasswordSetup = activeMemberships === 0;

    return {
      tenantName: membership.tenant.name,
      email: membership.user.email,
      roles: membership.roles.map((mr) => mr.role.name),
      requiresPasswordSetup,
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

    return { message: 'Invitation resent successfully.' };
  }

  async cancelInvitation(
    membershipId: string,
    tenantId: string,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Invitation not found.');
    }

    if (membership.status !== 'INVITED') {
      throw new BadRequestException(
        'Only pending invitations can be cancelled.',
      );
    }

    await this.prisma.tenantMembership.update({
      where: { id: membership.id },
      data: {
        status: 'REMOVED',
        invitationTokenHash: null,
        invitationExpiresAt: null,
      },
    });

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
