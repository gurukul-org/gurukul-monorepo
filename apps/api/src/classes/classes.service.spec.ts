/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { ClassesService } from './classes.service';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: any;

  const mockPrisma = {
    academicTerm: {
      findFirst: jest.fn(),
    },
    program: {
      findFirst: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    classInstructor: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    enrolment: {
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a class successfully and set name Class #1 if name not provided', async () => {
      prisma.academicTerm.findFirst.mockResolvedValue({
        id: 'term-1',
        name: 'Fall 2026',
      });
      prisma.program.findFirst.mockResolvedValue({
        id: 'program-1',
        name: '9th Grade',
      });
      prisma.class.count.mockResolvedValue(0);
      prisma.class.create.mockResolvedValue({
        id: 'class-1',
        name: 'Class #1',
        maxCapacity: 30,
      });

      const result = await service.create('tenant-1', 'user-1', {
        programId: 'program-1',
        academicTermId: 'term-1',
        maxCapacity: 30,
      });

      expect(prisma.academicTerm.findFirst).toHaveBeenCalled();
      expect(prisma.program.findFirst).toHaveBeenCalled();
      expect(prisma.class.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          programId: 'program-1',
          academicTermId: 'term-1',
          deletedAt: null,
        },
      });
      expect(prisma.class.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          academicTermId: 'term-1',
          programId: 'program-1',
          name: 'Class #1',
          maxCapacity: 30,
          status: 'ACTIVE',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
      expect(result.name).toBe('Class #1');
    });

    it('should create a class with explicit section name if provided', async () => {
      prisma.academicTerm.findFirst.mockResolvedValue({
        id: 'term-1',
        name: 'Fall 2026',
      });
      prisma.program.findFirst.mockResolvedValue({
        id: 'program-1',
        name: '9th Grade',
      });
      prisma.class.create.mockResolvedValue({
        id: 'class-1',
        name: 'Section A',
        maxCapacity: 30,
      });

      const result = await service.create('tenant-1', 'user-1', {
        programId: 'program-1',
        academicTermId: 'term-1',
        name: 'Section A',
        maxCapacity: 30,
      });

      expect(prisma.class.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          academicTermId: 'term-1',
          programId: 'program-1',
          name: 'Section A',
          maxCapacity: 30,
          status: 'ACTIVE',
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
      expect(result.name).toBe('Section A');
    });

    it('should block class creation in an archived/non-existent term', async () => {
      prisma.academicTerm.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', 'user-1', {
          programId: 'program-1',
          academicTermId: 'term-1',
          maxCapacity: 30,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should successfully update fields', async () => {
      const existingClass = {
        id: 'class-1',
        name: 'Section A',
        maxCapacity: 30,
        enrolments: [],
      };
      prisma.class.findFirst.mockResolvedValue(existingClass);
      prisma.class.update.mockResolvedValue({
        ...existingClass,
        name: 'Section A Rev',
        maxCapacity: 40,
      });

      const result = await service.update('tenant-1', 'user-1', 'class-1', {
        name: 'Section A Rev',
        maxCapacity: 40,
      });

      expect(prisma.class.update).toHaveBeenCalledWith({
        where: { id: 'class-1' },
        data: {
          name: 'Section A Rev',
          maxCapacity: 40,
          status: undefined,
          updatedBy: 'user-1',
        },
      });
      expect(result.maxCapacity).toBe(40);
      expect(result.name).toBe('Section A Rev');
    });

    it('should block reducing capacity below current active enrollment', async () => {
      const existingClass = {
        id: 'class-1',
        name: 'Section A',
        maxCapacity: 30,
        enrolments: [{ id: 'e1' }, { id: 'e2' }], // 2 active enrolments
      };
      prisma.class.findFirst.mockResolvedValue(existingClass);

      await expect(
        service.update('tenant-1', 'user-1', 'class-1', {
          maxCapacity: 1, // reduced below 2
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should hard delete a class if it has 0 enrollments', async () => {
      prisma.class.findFirst.mockResolvedValue({
        id: 'class-1',
        _count: { enrolments: 0 },
      });
      prisma.class.delete.mockResolvedValue({ id: 'class-1' });

      await service.remove('tenant-1', 'user-1', 'class-1');

      expect(prisma.class.delete).toHaveBeenCalledWith({
        where: { id: 'class-1' },
      });
    });

    it('should block hard-delete if class has ever had enrollments', async () => {
      prisma.class.findFirst.mockResolvedValue({
        id: 'class-1',
        _count: { enrolments: 5 },
      });

      await expect(
        service.remove('tenant-1', 'user-1', 'class-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
