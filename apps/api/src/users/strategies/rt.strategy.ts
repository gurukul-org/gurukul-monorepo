import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { Request } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { Strategy } from 'passport-custom';

import { JwtPayloadWithRt } from '../types';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async validate(req: Request): Promise<JwtPayloadWithRt> {
    const authHeader = req?.get('authorization');
    const bearerMatch = authHeader && /^Bearer\s+(.+)$/i.exec(authHeader);
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
      'refreshToken'
    ];
    const refreshToken = cookieToken || (bearerMatch ? bearerMatch[1] : null);

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
