import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { PrismaClient } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { Strategy } from 'passport-custom';

import { JwtPayloadWithRt } from '../types';

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService & PrismaClient) {
    super();
  }

  async validate(req: RequestWithCookies): Promise<JwtPayloadWithRt> {
    const cookies = req.cookies as unknown as
      | Record<string, string>
      | undefined;
    const cookieRefreshToken = cookies?.['refreshToken'];
    const authorization = req.get('authorization');
    const bearerRefreshToken = authorization?.replace('Bearer', '').trim();
    const refreshToken = cookieRefreshToken || bearerRefreshToken;

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    const session = await this.prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new ForbiddenException('Access Denied');
    }

    return {
      sub: session.userId,
      email: session.user.email,
      refreshToken,
    };
  }
}
