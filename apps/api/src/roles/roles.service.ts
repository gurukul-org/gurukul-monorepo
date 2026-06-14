import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FEATURES,
  featuresByEditorCategory,
  isValidPermissionId,
} from '@repo/permissions';
import { PrismaService } from 'nestjs-prisma';

import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all roles for a tenant, including their permissions and
   * the count of users assigned to each role.
   */
  async findAll(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        permissions: { select: { permissionId: true } },
        _count: { select: { membershipRoles: true } },
      },
      orderBy: { rank: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      rank: role.rank,
      isAdmin: role.isAdmin,
      isSystemRole: role.isSystemRole,
      permissions: role.permissions.map((p) => p.permissionId),
      memberCount: role._count.membershipRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  /**
   * Get a single role with full details.
   */
  async findOne(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      include: {
        permissions: { select: { permissionId: true } },
        _count: { select: { membershipRoles: true } },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      rank: role.rank,
      isAdmin: role.isAdmin,
      isSystemRole: role.isSystemRole,
      permissions: role.permissions.map((p) => p.permissionId),
      memberCount: role._count.membershipRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Create a custom role. The caller's highest role rank is used to
   * enforce privilege escalation prevention.
   */
  async create(tenantId: string, dto: CreateRoleDto, callerRank: number) {
    // Rank enforcement: caller can only create roles with a lower privilege
    if (dto.rank <= callerRank) {
      throw new ForbiddenException(
        `You cannot create a role with rank ${dto.rank}. Your highest role rank is ${callerRank}; new roles must have a higher rank number (lower privilege).`,
      );
    }

    // Validate all permission IDs
    this.validatePermissionIds(dto.permissions);

    // Check for name uniqueness within tenant
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        `A role named "${dto.name}" already exists in this tenant.`,
      );
    }

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        rank: dto.rank,
        isAdmin: false, // Custom roles are never admin
        isSystemRole: false,
      },
    });

    // Create role permissions
    if (dto.permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissions.map((permId) => ({
          roleId: role.id,
          permissionId: permId,
        })),
      });
    }

    return this.findOne(tenantId, role.id);
  }

  /**
   * Update a role (name, description, rank, and/or permissions).
   * System roles can have their permissions modified but not their name/rank.
   */
  async update(
    tenantId: string,
    roleId: string,
    dto: UpdateRoleDto,
    callerRank: number,
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
    });

    if (!role) throw new NotFoundException('Role not found');

    // Caller cannot edit a role with higher or equal privilege
    if (role.rank <= callerRank) {
      throw new ForbiddenException(
        'You cannot modify a role with higher or equal privilege than your own.',
      );
    }

    // System role restrictions: cannot change name or rank
    if (role.isSystemRole && (dto.name || dto.rank !== undefined)) {
      throw new BadRequestException(
        'Cannot change the name or rank of a system role. You may only modify its permissions and description.',
      );
    }

    // Validate rank if being changed
    if (dto.rank !== undefined && dto.rank <= callerRank) {
      throw new ForbiddenException(
        `You cannot set rank to ${dto.rank}. New rank must be a higher number (lower privilege) than your own rank (${callerRank}).`,
      );
    }

    // Check name uniqueness if being changed
    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findFirst({
        where: { tenantId, name: dto.name, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(
          `A role named "${dto.name}" already exists in this tenant.`,
        );
      }
    }

    // Validate permission IDs if being changed
    if (dto.permissions) {
      this.validatePermissionIds(dto.permissions);
    }

    await this.prisma.$transaction(async (tx) => {
      // Update role fields
      const updateData: Record<string, unknown> = {};
      if (dto.name) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.rank !== undefined) updateData.rank = dto.rank;

      if (Object.keys(updateData).length > 0) {
        await tx.role.update({
          where: { id: roleId },
          data: updateData,
        });
      }

      // Replace permissions if provided (full replacement)
      if (dto.permissions) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        if (dto.permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissions.map((permId) => ({
              roleId,
              permissionId: permId,
            })),
          });
        }
      }
    });

    return this.findOne(tenantId, roleId);
  }

  /**
   * Soft-delete a custom role. System roles cannot be deleted.
   * Roles with assigned members cannot be deleted.
   */
  async remove(tenantId: string, roleId: string, callerRank: number) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null },
      include: {
        _count: { select: { membershipRoles: true } },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystemRole) {
      throw new BadRequestException(
        'System roles cannot be deleted. You may only modify their permissions.',
      );
    }

    if (role.rank <= callerRank) {
      throw new ForbiddenException(
        'You cannot delete a role with higher or equal privilege than your own.',
      );
    }

    if (role._count.membershipRoles > 0) {
      throw new BadRequestException(
        `This role is currently assigned to ${role._count.membershipRoles} member(s). Remove all assignments before deleting.`,
      );
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Role deleted successfully' };
  }

  /**
   * Return the full permissions registry grouped by editor category.
   * Used by the frontend role editor UI.
   */
  getPermissionsRegistry() {
    const categories = featuresByEditorCategory();

    return Object.entries(categories).map(([category, features]) => ({
      category,
      features: features.map((feature) => ({
        key: feature.key,
        title: feature.title,
        iconName: feature.iconName,
        permissions: Object.values(feature.permissions).map((perm) => ({
          id: perm.id,
          label: perm.label,
          description: perm.description,
          kind: perm.kind,
        })),
      })),
    }));
  }

  /**
   * Get the highest (lowest rank number = highest privilege) role rank
   * for the caller based on their membership.
   */
  async getCallerHighestRank(membershipId: string): Promise<number> {
    const membershipRoles = await this.prisma.membershipRole.findMany({
      where: { tenantMembershipId: membershipId },
      include: { role: { select: { rank: true } } },
    });

    if (membershipRoles.length === 0) return Infinity;

    return Math.min(...membershipRoles.map((mr) => mr.role.rank));
  }

  /**
   * Validate that all permission IDs exist in the @repo/permissions registry.
   */
  private validatePermissionIds(ids: string[]): void {
    const invalid = ids.filter((id) => !isValidPermissionId(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid permission ID(s): ${invalid.join(', ')}. These do not exist in the permissions registry.`,
      );
    }
  }
}
