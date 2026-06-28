/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let prisma: any;

  const mockPrisma = {
    program: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    course: {
      count: jest.fn(),
    },
    enrolment: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a program successfully if code is unique', async () => {
      prisma.program.findFirst.mockResolvedValue(null);
      prisma.program.create.mockResolvedValue({ id: 'p1', code: 'CS-101' });

      const result = await service.create('tenant1', 'user1', {
        name: 'Computer Science',
        code: 'CS-101',
        description: 'CS program',
      });

      expect(prisma.program.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1', code: 'CS-101' },
      });
      expect(prisma.program.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if program code already exists', async () => {
      prisma.program.findFirst.mockResolvedValue({ id: 'p1', code: 'CS-101' });

      await expect(
        service.create('tenant1', 'user1', {
          name: 'Computer Science',
          code: 'CS-101',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update other fields without code change warning', async () => {
      const existing = { id: 'p1', code: 'CS-101', name: 'CS' };
      prisma.program.findFirst.mockResolvedValue(existing);
      prisma.program.update.mockResolvedValue({ ...existing, name: 'CS Rev' });

      const result = await service.update('tenant1', 'user1', 'p1', {
        name: 'CS Rev',
      });

      expect(prisma.program.update).toHaveBeenCalled();
      expect(result.name).toBe('CS Rev');
    });

    it('should warn when changing code and ignoreWarnings is not passed', async () => {
      const existing = { id: 'p1', code: 'CS-101', name: 'CS' };
      prisma.program.findFirst.mockResolvedValue(existing);
      prisma.program.findFirst.mockResolvedValueOnce(existing); // for retrieve
      prisma.program.findFirst.mockResolvedValueOnce(null); // for uniqueness check of new code
      prisma.course.count.mockResolvedValue(2); // 2 courses linked

      await expect(
        service.update('tenant1', 'user1', 'p1', {
          code: 'CS-202',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should bypass warning if ignoreWarnings is true', async () => {
      const existing = { id: 'p1', code: 'CS-101', name: 'CS' };
      prisma.program.findFirst.mockResolvedValue(existing);
      prisma.program.findFirst.mockResolvedValueOnce(existing);
      prisma.program.findFirst.mockResolvedValueOnce(null);
      prisma.program.update.mockResolvedValue({ ...existing, code: 'CS-202' });

      const result = await service.update('tenant1', 'user1', 'p1', {
        code: 'CS-202',
        ignoreWarnings: true,
      });

      expect(prisma.program.update).toHaveBeenCalled();
      expect(result.code).toBe('CS-202');
    });
  });

  describe('remove', () => {
    it('should hard-delete program if course count is zero', async () => {
      prisma.program.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.course.count.mockResolvedValue(0);
      prisma.program.delete.mockResolvedValue({ id: 'p1' });

      await service.remove('tenant1', 'user1', 'p1');

      expect(prisma.program.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });

    it('should throw BadRequestException if program has courses associated', async () => {
      prisma.program.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.course.count.mockResolvedValue(3);

      await expect(service.remove('tenant1', 'user1', 'p1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
