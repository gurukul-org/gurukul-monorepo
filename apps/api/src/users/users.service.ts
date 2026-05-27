import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LoginDto, SignupDto } from './dto';
import { Tokens } from './types';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }

    async signup(dto: SignupDto): Promise<Tokens> {
        const hash = await this.hashData(dto.password);

        try {
            const newUser = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.phone,
                },
            });

            const tokens = await this.generateTokens(newUser.id, newUser.email);
            return tokens;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    async login(dto: LoginDto): Promise<Tokens> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new ForbiddenException('Access Denied');

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) throw new ForbiddenException('Access Denied');

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
            include: { user: true },
        });

        if (!session || session.userId !== userId || session.expiresAt < new Date()) {
            if (session) {
                await this.prisma.session.delete({ where: { id: session.id } });
            }
            throw new ForbiddenException('Access Denied');
        }

        // Rotate session
        await this.prisma.session.delete({ where: { id: session.id } });
        return this.generateTokens(session.userId, session.user.email);
    }

    private async generateTokens(userId: string, email: string): Promise<Tokens> {
        const accessToken = await this.jwtService.signAsync(
            { sub: userId, email },
            {
                secret: this.config.get<string>('AT_SECRET') || 'at-secret',
                expiresIn: '15m',
            },
        );

        const refreshToken = randomBytes(40).toString('hex');

        await this.prisma.session.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    private hashData(data: string) {
        return bcrypt.hash(data, 10);
    }
}
