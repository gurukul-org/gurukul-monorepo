import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { EmailService } from '../email/email.service';
import { UsersService } from './users.service';

type PrismaMock = {
  tenantMembership: { findFirst: jest.Mock; update: jest.Mock };
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

describe('UsersService — member management', () => {
  let service: UsersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      tenantMembership: { findFirst: jest.fn(), update: jest.fn() },
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
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(), getOrThrow: jest.fn() },
        },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  // Helper: stage the founding membership + caller roles + target membership
  // that loadManageableTarget loads, in call order.
  function stageTarget(opts: {
    founding?: { id: string };
    callerRoles?: { role: { rank: number; isAdmin: boolean } }[];
    target: {
      id: string;
      userId: string;
      status: string;
      roles: { role: { rank: number; isAdmin: boolean } }[];
    } | null;
  }) {
    prisma.tenantMembership.findFirst
      .mockResolvedValueOnce(opts.founding ?? { id: 'founder-membership' })
      .mockResolvedValueOnce(opts.target);
    prisma.membershipRole.findMany.mockResolvedValueOnce(
      opts.callerRoles ?? [],
    );
  }

  describe('suspendMember', () => {
    it('suspends an active member, stamps the actor and kills their sessions', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });

      const result = await service.suspendMember(TENANT, CALLER, ACTOR, TARGET);

      expect(prisma.tenantMembership.update).toHaveBeenCalledWith({
        where: { id: TARGET },
        data: { status: 'SUSPENDED', updatedById: ACTOR },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-target', tenantId: TENANT },
      });
      expect(result.message).toMatch(/suspended/i);
    });

    it('rejects suspending an already-suspended member', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'SUSPENDED',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });

      await expect(
        service.suspendMember(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.tenantMembership.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivateMember', () => {
    it('reactivates a suspended member without touching sessions', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'SUSPENDED',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });

      const result = await service.reactivateMember(
        TENANT,
        CALLER,
        ACTOR,
        TARGET,
      );

      expect(prisma.tenantMembership.update).toHaveBeenCalledWith({
        where: { id: TARGET },
        data: { status: 'ACTIVE', updatedById: ACTOR },
      });
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
      expect(result.message).toMatch(/reactivated/i);
    });

    it('rejects reactivating a member that is not suspended', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });

      await expect(
        service.reactivateMember(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('changeMemberRoles', () => {
    it('replaces roles and records the actor', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([
        { id: 'role-a', rank: 6 },
        { id: 'role-b', rank: 7 },
      ]);

      const result = await service.changeMemberRoles(
        TENANT,
        CALLER,
        ACTOR,
        TARGET,
        ['role-a', 'role-b'],
      );

      expect(prisma.membershipRole.deleteMany).toHaveBeenCalledWith({
        where: { tenantMembershipId: TARGET },
      });
      expect(prisma.membershipRole.createMany).toHaveBeenCalledWith({
        data: [
          { tenantMembershipId: TARGET, roleId: 'role-a', assignedById: ACTOR },
          { tenantMembershipId: TARGET, roleId: 'role-b', assignedById: ACTOR },
        ],
      });
      expect(result.message).toMatch(/updated/i);
    });

    it('blocks assigning a role with equal or higher privilege than the caller', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 3, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });
      // role rank 3 == caller's highest privilege → escalation attempt.
      prisma.role.findMany.mockResolvedValueOnce([{ id: 'role-x', rank: 3 }]);

      await expect(
        service.changeMemberRoles(TENANT, CALLER, ACTOR, TARGET, ['role-x']),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.membershipRole.createMany).not.toHaveBeenCalled();
    });

    it('rejects unknown role ids', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }],
        },
      });
      prisma.role.findMany.mockResolvedValueOnce([]); // none found

      await expect(
        service.changeMemberRoles(TENANT, CALLER, ACTOR, TARGET, ['ghost']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('privilege guard (via revokeTenantAccess)', () => {
    it('forbids acting on yourself', async () => {
      // caller === target short-circuits before any target load.
      prisma.tenantMembership.findFirst.mockResolvedValueOnce({
        id: 'founder-membership',
      });
      prisma.membershipRole.findMany.mockResolvedValueOnce([]);

      await expect(
        service.revokeTenantAccess(TENANT, CALLER, ACTOR, CALLER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forbids acting on the tenant owner', async () => {
      stageTarget({
        founding: { id: TARGET }, // target IS the founding membership
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 1, isAdmin: true } }],
        },
      });

      await expect(
        service.revokeTenantAccess(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids acting on an admin', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: true } }],
        },
      });

      await expect(
        service.revokeTenantAccess(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids acting on equal or higher privilege', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 5, isAdmin: false } }],
        target: {
          id: TARGET,
          userId: 'u-target',
          status: 'ACTIVE',
          roles: [{ role: { rank: 5, isAdmin: false } }], // equal rank
        },
      });

      await expect(
        service.revokeTenantAccess(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound when the target membership is missing', async () => {
      stageTarget({
        callerRoles: [{ role: { rank: 2, isAdmin: false } }],
        target: null,
      });

      await expect(
        service.revokeTenantAccess(TENANT, CALLER, ACTOR, TARGET),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getTenantMember', () => {
    it('throws NotFound when the membership does not exist', async () => {
      prisma.tenantMembership.findFirst
        .mockResolvedValueOnce({ id: 'founder-membership' }) // founding
        .mockResolvedValueOnce(null); // target

      await expect(
        service.getTenantMember(TENANT, TARGET),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
