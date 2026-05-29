import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from 'nestjs-prisma';

import { LoginDto } from './dto';
import { Tokens } from './types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
}
