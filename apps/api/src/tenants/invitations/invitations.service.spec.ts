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
