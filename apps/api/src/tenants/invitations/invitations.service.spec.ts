/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { EmailService } from '../../email/email.service';
import { InvitationsService } from './invitations.service';

type PrismaMock = {
  tenantMembership: {
    findUnique: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  membershipRole: {
    deleteMany: jest.Mock;
  };
  user: {
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('InvitationsService - cancelInvitation', () => {
  let service: InvitationsService;
  let prisma: PrismaMock;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    prisma = {
      tenantMembership: {
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      membershipRole: {
        deleteMany: jest.fn(),
      },
      user: {
        delete: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        Promise.resolve(cb(prisma)),
      ),
    };

    emailService = {
      sendInvitationEmail: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(InvitationsService);
  });

  it('throws NotFoundException if invitation does not exist', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce(null);

    await expect(service.cancelInvitation('m-1', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException if invitation tenantId does not match', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      tenantId: 'other-tenant',
      status: 'INVITED',
      user: { email: 'mock@example.com' },
    });

    await expect(service.cancelInvitation('m-1', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException if invitation is not INVITED', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      tenantId: 'tenant-1',
      status: 'ACTIVE',
      user: { email: 'mock@example.com' },
    });

    await expect(service.cancelInvitation('m-1', 'tenant-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deletes assigned roles, membership and the user if they have no other memberships', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'INVITED',
      user: { email: 'mock@example.com' },
    });

    prisma.tenantMembership.count.mockResolvedValueOnce(0);

    const result = await service.cancelInvitation('m-1', 'tenant-1');

    expect(result).toEqual({ message: 'Invitation cancelled successfully.' });
    expect(prisma.membershipRole.deleteMany).toHaveBeenCalledWith({
      where: { tenantMembershipId: 'm-1' },
    });
    expect(prisma.tenantMembership.delete).toHaveBeenCalledWith({
      where: { id: 'm-1' },
    });
    expect(prisma.tenantMembership.count).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('deletes assigned roles and membership but NOT the user if they have other memberships', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce({
      id: 'm-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'INVITED',
      user: { email: 'mock@example.com' },
    });

    prisma.tenantMembership.count.mockResolvedValueOnce(1); // has 1 other membership

    const result = await service.cancelInvitation('m-1', 'tenant-1');

    expect(result).toEqual({ message: 'Invitation cancelled successfully.' });
    expect(prisma.membershipRole.deleteMany).toHaveBeenCalledWith({
      where: { tenantMembershipId: 'm-1' },
    });
    expect(prisma.tenantMembership.delete).toHaveBeenCalledWith({
      where: { id: 'm-1' },
    });
    expect(prisma.tenantMembership.count).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});

describe('InvitationsService - student/parent portal invites', () => {
  let service: InvitationsService;
  let prisma: any;
  let emailService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      role: { findMany: jest.fn() },
      tenant: { findUnique: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      tenantMembership: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      membershipRole: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      studentProfile: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      parentProfile: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentParent: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: any) => any) =>
        Promise.resolve(cb(prisma)),
      ),
    };

    emailService = {
      sendInvitationEmail: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = moduleRef.get(InvitationsService);
  });

  it('pre-creates student profile with pre-linked parents on student invite', async () => {
    prisma.role.findMany.mockResolvedValueOnce([
      { id: 'r-student', name: 'Student' },
    ]);
    prisma.tenant.findUnique.mockResolvedValueOnce({
      id: 't-1',
      name: 'Tenant A',
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'inv-1',
      firstName: 'Inviter',
    }); // inviter
    prisma.user.findUnique.mockResolvedValueOnce(null); // invited user
    prisma.user.create.mockResolvedValueOnce({ id: 'u-student' });
    prisma.tenantMembership.create.mockResolvedValueOnce({ id: 'm-student' });
    prisma.studentProfile.findFirst.mockResolvedValueOnce(null);
    prisma.studentProfile.create.mockResolvedValueOnce({ id: 'sp-1' });

    const dto = {
      email: 'student@example.com',
      firstName: 'St',
      lastName: 'Ud',
      roleIds: ['r-student'],
      rollNumber: 'ST-001',
      admissionDate: '2026-07-01',
      preLinkedParentIds: ['parent-1'],
    };

    const res = await service.inviteUser(
      dto,
      't-1',
      'inv-1',
      ['invite-students'],
      false,
    );

    expect(res).toEqual({ message: 'Invitation sent successfully.' });
    expect(prisma.studentProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rollNumber: 'ST-001',
          tenantId: 't-1',
        }),
      }),
    );
    expect(prisma.studentParent.createMany).toHaveBeenCalledWith({
      data: [
        {
          studentProfileId: 'sp-1',
          parentProfileId: 'parent-1',
          relationship: 'GUARDIAN',
        },
      ],
    });
  });

  it('pre-creates parent profile on parent invite', async () => {
    prisma.role.findMany.mockResolvedValueOnce([
      { id: 'r-parent', name: 'Parent' },
    ]);
    prisma.tenant.findUnique.mockResolvedValueOnce({
      id: 't-1',
      name: 'Tenant A',
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'inv-1',
      firstName: 'Inviter',
    }); // inviter
    prisma.user.findUnique.mockResolvedValueOnce(null); // invited user
    prisma.user.create.mockResolvedValueOnce({ id: 'u-parent' });
    prisma.tenantMembership.create.mockResolvedValueOnce({ id: 'm-parent' });
    prisma.parentProfile.findFirst.mockResolvedValueOnce(null);
    prisma.parentProfile.create.mockResolvedValueOnce({ id: 'pp-1' });

    const dto = {
      email: 'parent@example.com',
      firstName: 'Pa',
      lastName: 'Rent',
      roleIds: ['r-parent'],
      emergencyPhone: '+919999999999',
    };

    const res = await service.inviteUser(
      dto,
      't-1',
      'inv-1',
      ['invite-parents'],
      false,
    );

    expect(res).toEqual({ message: 'Invitation sent successfully.' });
    expect(prisma.parentProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emergencyPhone: '+919999999999',
          tenantId: 't-1',
        }),
      }),
    );
  });

  it('reuses existing student profile on re-invitation', async () => {
    prisma.role.findMany.mockResolvedValueOnce([
      { id: 'r-student', name: 'Student' },
    ]);
    prisma.tenant.findUnique.mockResolvedValueOnce({
      id: 't-1',
      name: 'Tenant A',
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'inv-1',
      firstName: 'Inviter',
    }); // inviter
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u-student',
      memberships: [{ id: 'm-student', status: 'INVITED', tenantId: 't-1' }],
    });
    prisma.studentProfile.findFirst.mockResolvedValueOnce({
      id: 'sp-1',
      rollNumber: 'ST-001',
    });

    const dto = {
      email: 'student@example.com',
      firstName: 'St',
      lastName: 'Ud',
      roleIds: ['r-student'],
      rollNumber: 'ST-001-NEW',
    };

    const res = await service.inviteUser(
      dto,
      't-1',
      'inv-1',
      ['invite-students'],
      false,
    );

    expect(res).toEqual({ message: 'Invitation sent successfully.' });
    expect(prisma.studentProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sp-1' },
        data: expect.objectContaining({
          rollNumber: 'ST-001-NEW',
        }),
      }),
    );
  });

  it('accepts and finalizes student profile roll number and admission date', async () => {
    prisma.tenantMembership.findUnique.mockResolvedValueOnce({
      id: 'm-student',
      status: 'INVITED',
      userId: 'u-student',
      tenantId: 't-1',
      user: { email: 'student@example.com' },
    });
    prisma.tenantMembership.count.mockResolvedValueOnce(0); // requires password setup
    prisma.membershipRole.findMany.mockResolvedValueOnce([
      { role: { name: 'Student' } },
    ]);
    prisma.studentProfile.findFirst.mockResolvedValueOnce({
      id: 'sp-1',
      rollNumber: 'TEMP-student',
    });

    const dto = {
      token: 'valid-token',
      password: 'password123',
      rollNumber: 'REAL-ROLL-001',
      admissionDate: '2026-07-01',
    };

    const res = await service.acceptInvitation(dto);

    expect(res).toEqual({ message: 'Invitation accepted successfully.' });
    expect(prisma.studentProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sp-1' },
        data: expect.objectContaining({
          rollNumber: 'REAL-ROLL-001',
        }),
      }),
    );
  });
});
