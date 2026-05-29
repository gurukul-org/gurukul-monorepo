import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

import { Tenant } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'nestjs-prisma';

import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  TENANT_CACHE_TTL,
} from './tenant.constants';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Class method to validate if the subdomain is valid as per the regex rules defined
  validateSubdomainFormat(subdomain: string): boolean {
    return SUBDOMAIN_REGEX.test(subdomain);
  }

  // Class method to check if the subdomain is reserved
  isReservedSubdomain(subdomain: string): boolean {
    return RESERVED_SUBDOMAINS.has(subdomain);
  }

  // Class emthod to resolve the subdomain to tenantid
  async resolveTenant(subdomain: string): Promise<Tenant> {
    if (
      !this.validateSubdomainFormat(subdomain) ||
      this.isReservedSubdomain(subdomain)
    ) {
      throw new BadRequestException(`Subdomain ${subdomain} is invalid`);
    }

    // Check @nest/cache: if found then return
    const cachedSubdomain = await this.cacheManager.get<Tenant>(subdomain);
    if (cachedSubdomain) {
      return cachedSubdomain;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${subdomain} not found`);
    }

    // Set cache
    await this.cacheManager.set(subdomain, tenant, TENANT_CACHE_TTL);

    return tenant;
  }
}
