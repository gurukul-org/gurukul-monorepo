import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private prisma: PrismaService) {
        super();
    }

    async validate(req: Request): Promise<any> {
        const refreshToken = req.cookies?.['refreshToken'] || req
            ?.get('authorization')
            ?.replace('Bearer', '')
            .trim();

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
