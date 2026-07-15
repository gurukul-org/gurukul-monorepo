import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { MembersService } from './members.service';

type PrismaMock = {
  tenantMembership: { findFirst: jest.Mock; findUnique: jest.Mock };
  membershipRole: {
    findMany: jest.Mock;
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  role: { findMany: jest.Mock };
  session: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
};

const TENANT = 'tenant-1';
const CALLER = 'caller-membership';
const ACTOR = 'actor-user';
const TARGET = 'target-membership';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      tenantMembership: { findFirst: jest.fn(), findUnique: jest.fn() },
      membershipRole: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      role: { findMany: jest.fn() },
      session: { deleteMany: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: PrismaMock) => unknown) =>
        cb(prisma),
      ),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(MembersService);
  });

  // Helper to stage the mock resolution of resolveContext
  function stageContext(opts: {
    callerRoles: { role: { rank: number; isAdmin: boolean } }[];
    target: {
      id: string;
      userId: string;
      roles: {
        roleId: string;
        role: { id: string; name: string; rank: number; isAdmin: boolean };
      }[];
    } | null;
  }) {
    prisma.membershipRole.findMany.mockResolvedValueOnce(opts.callerRoles);
    prisma.tenantMembership.findFirst.mockResolvedValueOnce(opts.target);
  }

  describe('resolveContext guards', () => {
    it('throws NotFound if target member does not exist', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: null,
      });

      await expect(
        service.addRoles(TENANT, CALLER, ACTOR, TARGET, { roleIds: ['r1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids acting on a member with equal or higher privilege than caller', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 3, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-t',
              role: { id: 'r-t', name: 'Some Role', rank: 3, isAdmin: false },
            },
          ],
        },
      });

      await expect(
        service.addRoles(TENANT, CALLER, ACTOR, TARGET, { roleIds: ['r1'] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admins to bypass rank privilege check', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 5, isAdmin: true } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-t',
              role: { id: 'r-t', name: 'Some Role', rank: 2, isAdmin: false },
            },
          ],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'r1', name: 'Role 1', rank: 4 },
      ]);

      const logSpy = jest.spyOn(service['logger'], 'log');
      const result = await service.addRoles(TENANT, CALLER, ACTOR, TARGET, {
        roleIds: ['r1'],
      });

      expect(result.message).toContain('Roles added successfully');
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('addRoles', () => {
    it('assigns roles to member, invalidates session, and writes audit log', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-old',
              role: { id: 'r-old', name: 'Old Role', rank: 5, isAdmin: false },
            },
          ],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'r-new', name: 'New Role', rank: 4 },
      ]);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const result = await service.addRoles(TENANT, CALLER, ACTOR, TARGET, {
        roleIds: ['r-new'],
      });

      expect(result.message).toContain('Roles added successfully');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('New Role');
      expect(prisma.membershipRole.createMany).toHaveBeenCalledWith({
        data: [
          { tenantMembershipId: TARGET, roleId: 'r-new', assignedById: ACTOR },
        ],
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-target', tenantId: TENANT },
      });

      expect(logSpy).toHaveBeenCalled();
      const logMsg = logSpy.mock.calls[0][0];
      expect(logMsg).toContain('ADD_MEMBER_ROLES');
      expect(logMsg).toContain('r-new');
    });

    it('rejects adding duplicate role assignments', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-dup',
              role: { id: 'r-dup', name: 'Dup', rank: 4, isAdmin: false },
            },
          ],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'r-dup', name: 'Dup', rank: 4 },
      ]);

      await expect(
        service.addRoles(TENANT, CALLER, ACTOR, TARGET, { roleIds: ['r-dup'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects adding roles with equal/higher privilege than caller', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 3, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-old',
              role: { id: 'r-old', name: 'Old', rank: 5, isAdmin: false },
            },
          ],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'r-powerful', name: 'Powerful', rank: 2 },
      ]);

      await expect(
        service.addRoles(TENANT, CALLER, ACTOR, TARGET, {
          roleIds: ['r-powerful'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeRoles', () => {
    it('removes selected roles, invalidates session, and writes audit log', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-keep',
              role: { id: 'r-keep', name: 'Keep', rank: 4, isAdmin: false },
            },
            {
              roleId: 'r-remove',
              role: { id: 'r-remove', name: 'Remove', rank: 5, isAdmin: false },
            },
          ],
        },
      });

      const logSpy = jest.spyOn(service['logger'], 'log');

      const result = await service.removeRoles(TENANT, CALLER, ACTOR, TARGET, {
        roleIds: ['r-remove'],
      });

      expect(result.message).toContain('Roles removed successfully');
      expect(prisma.membershipRole.deleteMany).toHaveBeenCalledWith({
        where: { tenantMembershipId: TARGET, roleId: { in: ['r-remove'] } },
      });
      expect(logSpy).toHaveBeenCalled();
      const logMsg = logSpy.mock.calls[0][0];
      expect(logMsg).toContain('REMOVE_MEMBER_ROLES');
      expect(logMsg).toContain('r-remove');
    });

    it('prevents removing the last role from a member', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-last',
              role: { id: 'r-last', name: 'Last', rank: 4, isAdmin: false },
            },
          ],
        },
      });

      await expect(
        service.removeRoles(TENANT, CALLER, ACTOR, TARGET, {
          roleIds: ['r-last'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents Account Owner from removing the Account Owner role from themselves', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 1, isAdmin: false } }],
        target: {
          id: CALLER, // target is self
          userId: 'u-caller',
          roles: [
            {
              roleId: 'r-owner',
              role: {
                id: 'r-owner',
                name: 'Account Owner',
                rank: 1,
                isAdmin: false,
              },
            },
            {
              roleId: 'r-other',
              role: { id: 'r-other', name: 'Other', rank: 4, isAdmin: false },
            },
          ],
        },
      });

      await expect(
        service.removeRoles(TENANT, CALLER, ACTOR, CALLER, {
          roleIds: ['r-owner'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('replaceRoles', () => {
    it('swaps old role for new role, updates DB, and writes audit log', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-swap-out',
              role: { id: 'r-swap-out', name: 'Out', rank: 5, isAdmin: false },
            },
          ],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'r-swap-in', name: 'In', rank: 4 },
      ]);
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: TARGET,
        roles: [{ role: { id: 'r-swap-in', name: 'In' } }],
      });

      const logSpy = jest.spyOn(service['logger'], 'log');

      const result = await service.replaceRoles(TENANT, CALLER, ACTOR, TARGET, {
        swaps: [{ removeRoleId: 'r-swap-out', addRoleId: 'r-swap-in' }],
      });

      expect(result.message).toContain('Roles replaced successfully');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('In');

      expect(prisma.membershipRole.deleteMany).toHaveBeenCalledWith({
        where: { tenantMembershipId: TARGET, roleId: { in: ['r-swap-out'] } },
      });
      expect(prisma.membershipRole.createMany).toHaveBeenCalledWith({
        data: [
          {
            tenantMembershipId: TARGET,
            roleId: 'r-swap-in',
            assignedById: ACTOR,
          },
        ],
      });

      expect(logSpy).toHaveBeenCalled();
      const logMsg = logSpy.mock.calls[0][0];
      expect(logMsg).toContain('REPLACE_MEMBER_ROLES');
    });

    it('rejects replace operations that leave target with no roles', async () => {
      stageContext({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          roles: [
            {
              roleId: 'r-out',
              role: { id: 'r-out', name: 'Out', rank: 5, isAdmin: false },
            },
          ],
        },
      });

      await expect(
        service.replaceRoles(TENANT, CALLER, ACTOR, TARGET, {
          swaps: [{ removeRoleId: 'r-out', addRoleId: 'r-out' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
