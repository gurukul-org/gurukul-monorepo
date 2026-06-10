import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'nestjs-prisma';

import { EmailService } from '../email/email.service';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto';
import { Tokens } from './types';

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto, tenantId?: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        memberships: tenantId
          ? {
              where: {
                tenantId,
                status: 'ACTIVE',
                deletedAt: null,
              },
            }
          : false,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) throw new ForbiddenException('Access Denied');
    if (tenantId) {
      const membership = user.memberships[0];
      if (!membership) {
        throw new ForbiddenException('Access Denied');
      }
      return this.generateTokens(user.id, user.email, tenantId, membership.id);
    }

    return this.generateTokens(user.id, user.email);
  }

  async register(dto: RegisterDto): Promise<Tokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.hashData(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const response = {
      message: 'If an account exists, a password reset email has been sent.',
    };
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) return response;
    if (user.memberships.length === 0) return response;

    const token = randomBytes(32).toString('hex');
    const resetPasswordTokenHash = this.hashToken(token);
    const resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash,
        resetPasswordExpiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      this.buildResetPasswordUrl(token),
    );

    return response;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetPasswordTokenHash = this.hashToken(dto.token);
    const user = await this.prisma.user.findUnique({
      where: { resetPasswordTokenHash },
    });

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt < new Date()
    ) {
      throw new ForbiddenException('Invalid or expired reset token');
    }

    const hash = await this.hashData(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });

    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const hash = await this.hashData(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });

    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('Access Denied');

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) throw new ForbiddenException('Access Denied');

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('Email already exists');
    }

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { email: dto.email },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }

    await this.prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return { message: 'Email changed successfully' };
  }

  async logout(userId: string, rt: string): Promise<boolean> {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: rt,
      },
    });
    return true;
  }

  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const session = await this.prisma.session.findUnique({
      where: { token: rt },
      include: {
        user: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.expiresAt < new Date()
    ) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new ForbiddenException('Access Denied');
    }

    let membershipId: string | undefined;
    if (session.tenantId) {
      const activeMembership = session.user.memberships.find(
        (m) =>
          m.tenantId === session.tenantId &&
          m.status === 'ACTIVE' &&
          m.deletedAt === null,
      );
      if (!activeMembership) {
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new ForbiddenException('Access Denied');
      }
      membershipId = activeMembership.id;
    }

    // Rotate session
    await this.prisma.session.delete({ where: { id: session.id } });
    return this.generateTokens(
      session.userId,
      session.user.email,
      session.tenantId || undefined,
      membershipId,
    );
  }

  async generateTokens(
    userId: string,
    email: string,
    tenantId?: string,
    membershipId?: string,
  ): Promise<Tokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, tenantId, membershipId },
      {
        secret: this.config.getOrThrow<string>('AT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = randomBytes(40).toString('hex');

    await this.prisma.session.create({
      data: {
        token: refreshToken,
        userId,
        tenantId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private hashData(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildResetPasswordUrl(token: string): string {
    const resetPasswordUrl =
      this.config.get<string>('FRONTEND_RESET_PASSWORD_URL') ||
      'http://localhost:3000/reset-password';
    const url = new URL(resetPasswordUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private isUniqueConstraintError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
