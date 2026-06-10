import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Tenant } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'nestjs-prisma';

import { Tokens } from '../users/types';
import { UsersService } from '../users/users.service';
import { CreateTenantDto } from './dto';
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  TENANT_CACHE_TTL,
} from './tenants.constants';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  validateSubdomainFormat(subdomain: string): boolean {
    return SUBDOMAIN_REGEX.test(subdomain);
  }

  isReservedSubdomain(subdomain: string): boolean {
    return RESERVED_SUBDOMAINS.has(subdomain);
  }

  /**
   * Resolves a subdomain to an active Tenant. Returns null for invalid format,
   * reserved subdomains, unknown subdomains, and soft-deleted tenants. Callers
   * that require a tenant must enforce it themselves (e.g. via TenantGuard).
   */
  async resolveTenant(subdomain: string): Promise<Tenant | null> {
    if (!this.validateSubdomainFormat(subdomain)) return null;
    if (this.isReservedSubdomain(subdomain)) return null;

    const cacheKey = this.cacheKey(subdomain);
    const cached = await this.cacheManager.get<Tenant>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findFirst({
      where: { subdomain, deletedAt: null },
    });
    if (!tenant) return null;

    await this.cacheManager.set(cacheKey, tenant, TENANT_CACHE_TTL);
    return tenant;
  }

  async invalidateTenantCache(subdomain: string): Promise<void> {
    await this.cacheManager.del(this.cacheKey(subdomain));
  }

  /**
   * Creates a new tenant. The authenticated user becomes the tenant owner.
   */
  async createTenant(
    dto: CreateTenantDto,
    currentUserId: string,
  ): Promise<Tokens> {
    if (!this.validateSubdomainFormat(dto.subdomain)) {
      throw new BadRequestException(
        'Invalid subdomain. Use 3-63 lowercase letters, digits, or hyphens (not starting or ending with a hyphen).',
      );
    }
    if (this.isReservedSubdomain(dto.subdomain)) {
      throw new ConflictException('This subdomain is reserved.');
    }

    const existing = await this.prisma.tenant.findFirst({
      where: { subdomain: dto.subdomain, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This subdomain is already taken.');
    }

    const owner = await this.resolveAuthenticatedOwner(currentUserId);

    const { tenantId, membershipId } = await this.prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            subdomain: dto.subdomain,
            name: dto.name,
            type: dto.type,
            settings: {},
          },
        });
        const membership = await tx.tenantMembership.create({
          data: {
            tenantId: tenant.id,
            userId: owner.id,
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        });
        return { tenantId: tenant.id, membershipId: membership.id };
      },
    );

    return this.usersService.generateTokens(
      owner.id,
      owner.email,
      tenantId,
      membershipId,
    );
  }

  private cacheKey(subdomain: string): string {
    return `tenant:${subdomain}`;
  }

  private async resolveAuthenticatedOwner(
    userId: string,
  ): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new BadRequestException('Authenticated user not found.');
    }
    return { id: user.id, email: user.email };
  }
}
