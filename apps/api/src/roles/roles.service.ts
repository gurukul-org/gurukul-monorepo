import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import {
  DEFAULT_ROLES,
  FEATURES,
  featuresByEditorCategory,
  isValidPermissionId,
} from '@repo/permissions';

import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('Starting default roles synchronization...');
    try {
      await this.syncSystemRoles();
      this.logger.log('Default roles synchronization completed.');
    } catch (err) {
      this.logger.error('Failed to sync default roles on startup', err);
    }
  }

  async syncSystemRoles() {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    for (const tenant of tenants) {
      const tenantId = tenant.id;

      // Fetch all roles for this tenant
      const existingRoles = await this.prisma.role.findMany({
        where: { tenantId },
        include: { permissions: true },
      });

      const roleByName = new Map(existingRoles.map((r) => [r.name, r]));

      // Map old obsolete roles to new default roles
      const legacyToNewMapping: Record<string, string> = {
        Owner: 'Account Owner',
        'Branch Manager': 'Coordinators',
        'Academic Director': 'Coordinators',
        'Administrative Officer': 'Coordinators',
        Faculty: 'Teacher',
        Staff: 'Coordinators',
        Parent: 'Parents',
      };

      const newRoleIdsByName = new Map<string, string>();

      // Create or update default roles
      for (const def of DEFAULT_ROLES) {
        let role = roleByName.get(def.title);
        if (!role) {
          role = await this.prisma.role.create({
            data: {
              tenantId,
              name: def.title,
              rank: def.rank,
              isAdmin: def.isAdmin,
              isSystemRole: true,
            },
            include: { permissions: true },
          });
          this.logger.log(
            `Created default role "${def.title}" for tenant ${tenantId}`,
          );
        } else {
          const needsUpdate =
            role.rank !== def.rank ||
            role.isAdmin !== def.isAdmin ||
            !role.isSystemRole;

          if (needsUpdate) {
            role = await this.prisma.role.update({
              where: { id: role.id },
              data: {
                rank: def.rank,
                isAdmin: def.isAdmin,
                isSystemRole: true,
              },
              include: { permissions: true },
            });
            this.logger.log(
              `Updated default role "${def.title}" for tenant ${tenantId}`,
            );
          }
        }

        newRoleIdsByName.set(def.title, role.id);

        // Sync permissions
        const currentPerms = new Set(
          role.permissions.map((p) => p.permissionId),
        );
        const expectedPerms = new Set<string>(def.scopes);

        const toAdd = def.scopes.filter((p) => !currentPerms.has(p));
        const toRemove = Array.from(currentPerms).filter(
          (p) => !expectedPerms.has(p),
        );

        if (toRemove.length > 0) {
          await this.prisma.rolePermission.deleteMany({
            where: {
              roleId: role.id,
              permissionId: { in: toRemove },
            },
          });
        }
        if (toAdd.length > 0) {
          await this.prisma.rolePermission.createMany({
            data: toAdd.map((permissionId) => ({
              roleId: role.id,
              permissionId,
            })),
          });
        }
      }

      // Migrate user assignments from old obsolete roles to the new ones
      for (const [legacyName, newName] of Object.entries(legacyToNewMapping)) {
        const legacyRole = roleByName.get(legacyName);
        const newRoleId = newRoleIdsByName.get(newName);

        if (legacyRole && newRoleId && legacyRole.id !== newRoleId) {
          const assignments = await this.prisma.membershipRole.findMany({
            where: { roleId: legacyRole.id },
          });

          for (const assignment of assignments) {
            const exists = await this.prisma.membershipRole.findFirst({
              where: {
                tenantMembershipId: assignment.tenantMembershipId,
                roleId: newRoleId,
              },
            });

            if (!exists) {
              await this.prisma.membershipRole.create({
                data: {
                  tenantMembershipId: assignment.tenantMembershipId,
                  roleId: newRoleId,
                  assignedById: assignment.assignedById,
                },
              });
            }
          }

          // Delete obsolete role assignments
          await this.prisma.membershipRole.deleteMany({
            where: { roleId: legacyRole.id },
          });
        }
      }

      // Delete obsolete default system roles
      const obsoleteRoleNames = Object.keys(legacyToNewMapping).filter(
        (name) => !newRoleIdsByName.has(name),
      );

      for (const obsoleteName of obsoleteRoleNames) {
        const obsoleteRole = roleByName.get(obsoleteName);
        if (obsoleteRole) {
          await this.prisma.rolePermission.deleteMany({
            where: { roleId: obsoleteRole.id },
          });
          await this.prisma.role.delete({
            where: { id: obsoleteRole.id },
          });
          this.logger.log(
            `Deleted obsolete system role "${obsoleteName}" for tenant ${tenantId}`,
          );
        }
      }

      // Ensure the founding member (oldest membership) gets the "Account Owner" role
      const foundingMembership = await this.prisma.tenantMembership.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
      const accountOwnerRoleId = newRoleIdsByName.get('Account Owner');
      if (foundingMembership && accountOwnerRoleId) {
        const hasAccountOwner = await this.prisma.membershipRole.findFirst({
          where: {
            tenantMembershipId: foundingMembership.id,
            roleId: accountOwnerRoleId,
          },
        });
        if (!hasAccountOwner) {
          await this.prisma.membershipRole.create({
            data: {
              tenantMembershipId: foundingMembership.id,
              roleId: accountOwnerRoleId,
            },
          });
          this.logger.log(
            `Assigned Account Owner role to founding member ${foundingMembership.id} for tenant ${tenantId}`,
          );
        }
      }

      // Ensure class instructors (primary = Class Incharge)
      const classInchargeRoleId = newRoleIdsByName.get('Class Incharge');
      if (classInchargeRoleId) {
        const primaryInstructors = await this.prisma.classInstructor.findMany({
          where: {
            tenantId,
            isPrimary: true,
            deletedAt: null,
          },
        });

        for (const instructor of primaryInstructors) {
          const exists = await this.prisma.membershipRole.findFirst({
            where: {
              tenantMembershipId: instructor.tenantMembershipId,
              roleId: classInchargeRoleId,
            },
          });

          if (!exists) {
            await this.prisma.membershipRole.create({
              data: {
                tenantMembershipId: instructor.tenantMembershipId,
                roleId: classInchargeRoleId,
              },
            });
            this.logger.log(
              `Assigned Class Incharge role to primary instructor membership ${instructor.tenantMembershipId} for tenant ${tenantId}`,
            );
          }
        }
      }
    }
  }

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
    const callerHasAccountOwner = callerRank === 1;
    const isCreateAllowed = callerHasAccountOwner
      ? dto.rank >= 1
      : dto.rank > callerRank;
    if (!isCreateAllowed) {
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
    const callerHasAccountOwner = callerRank === 1;
    const isUpdateAllowed = callerHasAccountOwner
      ? role.rank >= 1
      : role.rank > callerRank;
    if (!isUpdateAllowed) {
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
    if (dto.rank !== undefined) {
      const isRankAllowed = callerHasAccountOwner
        ? dto.rank >= 1
        : dto.rank > callerRank;
      if (!isRankAllowed) {
        throw new ForbiddenException(
          `You cannot set rank to ${dto.rank}. New rank must be a higher number (lower privilege) than your own rank (${callerRank}).`,
        );
      }
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
      if (dto.description !== undefined)
        updateData.description = dto.description;
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

    const callerHasAccountOwner = callerRank === 1;
    const isDeleteAllowed = callerHasAccountOwner
      ? role.rank >= 1
      : role.rank > callerRank;
    if (!isDeleteAllowed) {
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
