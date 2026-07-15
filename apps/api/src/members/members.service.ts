import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'nestjs-prisma';

import { AddRolesDto, RemoveRolesDto, ReplaceRolesDto } from './dto';

// The system name of the Account Owner role seeded at tenant creation.
// Used to prevent self-demotion.
const OWNER_ROLE_NAME = 'Account Owner';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // ADD ROLES
  // Assigns one or more additional roles to a member.
  // Enforces: rank guard, duplicate guard, session invalidation.
  // ---------------------------------------------------------------------------
  async addRoles(
    tenantId: string,
    callerMembershipId: string,
    callerUserId: string,
    targetMembershipId: string,
    dto: AddRolesDto,
  ): Promise<{ message: string; roles: { id: string; name: string }[] }> {
    const { targetMembership, callerMinRank, callerIsAdmin } =
      await this.resolveContext(
        tenantId,
        callerMembershipId,
        targetMembershipId,
      );

    // Validate that every requested role belongs to this tenant
    const rolesToAdd = await this.prisma.role.findMany({
      where: { id: { in: dto.roleIds }, tenantId, deletedAt: null },
    });

    if (rolesToAdd.length !== dto.roleIds.length) {
      throw new BadRequestException(
        'One or more role IDs are invalid or do not belong to this tenant.',
      );
    }

    // Rank guard: caller can only assign roles with a higher rank number (lower privilege)
    const callerViolation = rolesToAdd.find((r) => {
      if (callerMinRank === 1) return false;
      if (callerIsAdmin) {
        return r.isAdmin && r.rank <= callerMinRank;
      }
      return r.rank <= callerMinRank;
    });
    if (callerViolation) {
      throw new ForbiddenException(
        `You cannot assign the role "${callerViolation.name}" (rank ${callerViolation.rank}). ` +
          `Your highest role rank is ${callerMinRank}; you may only assign roles with a higher rank number (lower privilege).`,
      );
    }

    // Duplicate guard: reject roles already assigned to this member
    const currentRoleIds = new Set(
      targetMembership.roles.map((mr) => mr.roleId),
    );
    const duplicates = rolesToAdd.filter((r) => currentRoleIds.has(r.id));
    if (duplicates.length > 0) {
      throw new ConflictException(
        `The following roles are already assigned to this member: ${duplicates.map((r) => r.name).join(', ')}.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.membershipRole.createMany({
        data: rolesToAdd.map((role) => ({
          tenantMembershipId: targetMembershipId,
          roleId: role.id,
          assignedById: callerUserId,
        })),
      });

      // Invalidate target's active sessions in this tenant so new scopes take effect
      await tx.session.deleteMany({
        where: { userId: targetMembership.userId, tenantId },
      });
    });

    this.logger.log(
      `Roles added structure: ${JSON.stringify({
        action: 'ADD_MEMBER_ROLES',
        tenantId,
        actorUserId: callerUserId,
        targetMembershipId,
        addedRoleIds: dto.roleIds,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return {
      message: 'Roles added successfully. Member session invalidated.',
      roles: rolesToAdd.map((r) => ({ id: r.id, name: r.name })),
    };
  }

  // ---------------------------------------------------------------------------
  // REMOVE ROLES
  // Removes one or more specific roles from a member.
  // Enforces: last-role guard, self-demotion guard, rank guard, session invalidation.
  // ---------------------------------------------------------------------------
  async removeRoles(
    tenantId: string,
    callerMembershipId: string,
    callerUserId: string,
    targetMembershipId: string,
    dto: RemoveRolesDto,
  ): Promise<{ message: string }> {
    const { targetMembership, callerMinRank, callerIsAdmin } =
      await this.resolveContext(
        tenantId,
        callerMembershipId,
        targetMembershipId,
      );

    // Verify all role IDs are actually assigned to the target
    const currentRoleIds = new Set(
      targetMembership.roles.map((mr) => mr.roleId),
    );
    const notAssigned = dto.roleIds.filter((id) => !currentRoleIds.has(id));
    if (notAssigned.length > 0) {
      throw new BadRequestException(
        `The following role IDs are not assigned to this member: ${notAssigned.join(', ')}.`,
      );
    }

    // Last-role guard: member must retain at least one role
    const remainingCount = targetMembership.roles.length - dto.roleIds.length;
    if (remainingCount < 1) {
      throw new BadRequestException(
        'Cannot remove all roles from a member. They must retain at least one role. ' +
          'To revoke access entirely, use the remove member endpoint.',
      );
    }

    // Fetch the full role objects for the roles being removed
    const rolesToRemove = targetMembership.roles
      .filter((mr) => dto.roleIds.includes(mr.roleId))
      .map((mr) => mr.role);

    // Self-demotion guard: Owner cannot remove their own Owner role
    if (callerMembershipId === targetMembershipId) {
      const removingOwnerRole = rolesToRemove.some(
        (r) => r.name === OWNER_ROLE_NAME,
      );
      if (removingOwnerRole) {
        throw new ForbiddenException(
          `You cannot remove the ${OWNER_ROLE_NAME} role from yourself.`,
        );
      }
    }

    // Rank guard: caller can only remove roles with higher rank number (lower privilege) than their own
    const callerViolation = rolesToRemove.find((r) => {
      if (callerMinRank === 1) return false;
      if (callerIsAdmin) {
        return r.isAdmin && r.rank <= callerMinRank;
      }
      return r.rank <= callerMinRank;
    });
    if (callerViolation) {
      throw new ForbiddenException(
        `You cannot remove the role "${callerViolation.name}" (rank ${callerViolation.rank}). ` +
          `Your highest role rank is ${callerMinRank}; you may only manage roles with a higher rank number (lower privilege).`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.membershipRole.deleteMany({
        where: {
          tenantMembershipId: targetMembershipId,
          roleId: { in: dto.roleIds },
        },
      });

      // Invalidate target's active sessions in this tenant so reduced scopes take effect
      await tx.session.deleteMany({
        where: { userId: targetMembership.userId, tenantId },
      });
    });

    this.logger.log(
      `Roles removed structure: ${JSON.stringify({
        action: 'REMOVE_MEMBER_ROLES',
        tenantId,
        actorUserId: callerUserId,
        targetMembershipId,
        removedRoleIds: dto.roleIds,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return {
      message: 'Roles removed successfully. Member session invalidated.',
    };
  }

  // ---------------------------------------------------------------------------
  // REPLACE ROLES
  // Atomically removes one role and adds another per swap pair.
  // Enforces: rank guard, duplicate guard, last-role guard,
  //           self-demotion guard, session invalidation.
  // ---------------------------------------------------------------------------
  async replaceRoles(
    tenantId: string,
    callerMembershipId: string,
    callerUserId: string,
    targetMembershipId: string,
    dto: ReplaceRolesDto,
  ): Promise<{ message: string; roles: { id: string; name: string }[] }> {
    const { targetMembership, callerMinRank, callerIsAdmin } =
      await this.resolveContext(
        tenantId,
        callerMembershipId,
        targetMembershipId,
      );

    const currentRoleIds = new Set(
      targetMembership.roles.map((mr) => mr.roleId),
    );

    // Collect all unique role IDs involved in the swaps
    const removeIds = [...new Set(dto.swaps.map((s) => s.removeRoleId))];
    const addIds = [...new Set(dto.swaps.map((s) => s.addRoleId))];

    // Self-reference guard: a swap cannot have removeRoleId === addRoleId
    const selfSwap = dto.swaps.find((s) => s.removeRoleId === s.addRoleId);
    if (selfSwap) {
      throw new BadRequestException(
        'A role swap cannot have the same role as both the source and target.',
      );
    }

    // Verify all roles-to-remove are currently assigned
    const notAssigned = removeIds.filter((id) => !currentRoleIds.has(id));
    if (notAssigned.length > 0) {
      throw new BadRequestException(
        `The following role IDs to remove are not currently assigned to this member: ${notAssigned.join(', ')}.`,
      );
    }

    // Last-role guard: net change must leave at least 1 role
    // Net = (current) - (removed) + (added that are truly new)
    const genuinelyNew = addIds.filter((id) => !currentRoleIds.has(id));
    const netCount =
      targetMembership.roles.length - removeIds.length + genuinelyNew.length;
    if (netCount < 1) {
      throw new BadRequestException(
        'This operation would leave the member with no roles. ' +
          'A member must retain at least one role at all times.',
      );
    }

    // Fetch full role objects for all roles being added
    const rolesToAdd = await this.prisma.role.findMany({
      where: { id: { in: addIds }, tenantId, deletedAt: null },
    });

    if (rolesToAdd.length !== addIds.length) {
      throw new BadRequestException(
        'One or more role IDs to add are invalid or do not belong to this tenant.',
      );
    }

    // Fetch roles being removed from current assignments for rank + self-demotion checks
    const rolesToRemove = targetMembership.roles
      .filter((mr) => removeIds.includes(mr.roleId))
      .map((mr) => mr.role);

    // Self-demotion guard
    if (callerMembershipId === targetMembershipId) {
      const removingOwnerRole = rolesToRemove.some(
        (r) => r.name === OWNER_ROLE_NAME,
      );
      if (removingOwnerRole) {
        throw new ForbiddenException(
          `You cannot remove the ${OWNER_ROLE_NAME} role from yourself.`,
        );
      }
    }

    // Rank guard on roles being removed
    const removeViolation = rolesToRemove.find((r) => {
      if (callerMinRank === 1) return false;
      if (callerIsAdmin) {
        return r.isAdmin && r.rank <= callerMinRank;
      }
      return r.rank <= callerMinRank;
    });
    if (removeViolation) {
      throw new ForbiddenException(
        `You cannot remove the role "${removeViolation.name}" (rank ${removeViolation.rank}). ` +
          `Your highest role rank is ${callerMinRank}.`,
      );
    }

    // Rank guard on roles being added
    const addViolation = rolesToAdd.find((r) => {
      if (callerMinRank === 1) return false;
      if (callerIsAdmin) {
        return r.isAdmin && r.rank <= callerMinRank;
      }
      return r.rank <= callerMinRank;
    });
    if (addViolation) {
      throw new ForbiddenException(
        `You cannot assign the role "${addViolation.name}" (rank ${addViolation.rank}). ` +
          `Your highest role rank is ${callerMinRank}.`,
      );
    }

    // Duplicate guard: cannot add a role already on the member (and not being removed in same request)
    const afterRemoval = new Set(
      [...currentRoleIds].filter((id) => !removeIds.includes(id)),
    );
    const duplicates = rolesToAdd.filter((r) => afterRemoval.has(r.id));
    if (duplicates.length > 0) {
      throw new ConflictException(
        `The following roles are already assigned to this member and would result in duplicates: ` +
          `${duplicates.map((r) => r.name).join(', ')}.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove old roles
      await tx.membershipRole.deleteMany({
        where: {
          tenantMembershipId: targetMembershipId,
          roleId: { in: removeIds },
        },
      });

      // Add new roles — only the genuinely new ones (not already present and not removed)
      const toCreate = rolesToAdd.filter(
        (r) => !currentRoleIds.has(r.id) || removeIds.includes(r.id),
      );
      if (toCreate.length > 0) {
        await tx.membershipRole.createMany({
          data: toCreate.map((role) => ({
            tenantMembershipId: targetMembershipId,
            roleId: role.id,
            assignedById: callerUserId,
          })),
        });
      }

      // Invalidate target's sessions so new scopes take effect immediately
      await tx.session.deleteMany({
        where: { userId: targetMembership.userId, tenantId },
      });
    });

    // Return the member's full updated role list
    const updatedMembership = await this.prisma.tenantMembership.findUnique({
      where: { id: targetMembershipId },
      include: { roles: { include: { role: true } } },
    });

    this.logger.log(
      `Roles replaced structure: ${JSON.stringify({
        action: 'REPLACE_MEMBER_ROLES',
        tenantId,
        actorUserId: callerUserId,
        targetMembershipId,
        swaps: dto.swaps,
        timestamp: new Date().toISOString(),
      })}`,
    );

    return {
      message: 'Roles replaced successfully. Member session invalidated.',
      roles: (updatedMembership?.roles ?? []).map((mr) => ({
        id: mr.role.id,
        name: mr.role.name,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // SHARED CONTEXT RESOLVER
  // Loads caller rank + target membership in one place for all three operations.
  // ---------------------------------------------------------------------------
  private async resolveContext(
    tenantId: string,
    callerMembershipId: string,
    targetMembershipId: string,
  ) {
    // Load caller's roles to determine their best (lowest) rank
    const callerMembershipRoles = await this.prisma.membershipRole.findMany({
      where: { tenantMembershipId: callerMembershipId },
      include: { role: { select: { rank: true, isAdmin: true } } },
    });

    const callerMinRank =
      callerMembershipRoles.length === 0
        ? Infinity
        : Math.min(...callerMembershipRoles.map((mr) => mr.role.rank));

    const callerHasAccountOwner = callerMinRank === 1;
    const callerIsAdmin = callerMembershipRoles.some((mr) => mr.role.isAdmin);

    // Load target membership with full role info
    const targetMembership = await this.prisma.tenantMembership.findFirst({
      where: { id: targetMembershipId, tenantId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              select: { id: true, name: true, rank: true, isAdmin: true },
            },
          },
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException(
        'Target member was not found in this tenant.',
      );
    }

    const targetMinRank =
      targetMembership.roles.length === 0
        ? Infinity
        : Math.min(...targetMembership.roles.map((mr) => mr.role.rank));

    const targetIsAdmin = targetMembership.roles.some((mr) => mr.role.isAdmin);

    // Enforce hierarchy guard
    let isAllowed = false;
    if (callerHasAccountOwner) {
      // Account Owner can manage anyone (including other Account Owners)
      isAllowed = targetMinRank >= 1;
    } else if (callerIsAdmin) {
      // Admins (e.g. Principal) can manage any non-admin, or admin of strictly lower hierarchy (higher rank number)
      isAllowed = !targetIsAdmin || targetMinRank > callerMinRank;
    } else {
      // Non-admins can manage strictly lower hierarchy
      isAllowed = targetMinRank > callerMinRank;
    }

    if (!isAllowed) {
      throw new ForbiddenException(
        'You cannot manage roles for a member with equal or higher privilege than your own.',
      );
    }

    return { targetMembership, callerMinRank, callerIsAdmin };
  }
}
