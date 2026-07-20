/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: any;

  const mockPrisma = {
    program: {
      findFirst: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    class: {
      count: jest.fn(),
    },
    classInstructorCourse: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a course successfully', async () => {
      prisma.program.findFirst.mockResolvedValue({ id: 'program-1' });
      prisma.course.findFirst.mockResolvedValue(null);
      prisma.course.create.mockResolvedValue({
        id: 'course-1',
        name: 'Mathematics',
        code: 'MATH101',
      });

      const result = await service.create('tenant-1', 'user-1', {
        programId: 'program-1',
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Math Intro',
        credits: 4,
      });

      expect(prisma.program.findFirst).toHaveBeenCalled();
      expect(prisma.course.findFirst).toHaveBeenCalled();
      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          programId: 'program-1',
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Math Intro',
          credits: 4,
          createdBy: 'user-1',
          updatedBy: 'user-1',
        },
      });
      expect(result.id).toBe('course-1');
    });

    it('should throw BadRequestException if program is not found', async () => {
      prisma.program.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', 'user-1', {
          programId: 'program-invalid',
          name: 'Mathematics',
          code: 'MATH101',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if course code duplicate exists', async () => {
      prisma.program.findFirst.mockResolvedValue({ id: 'program-1' });
      prisma.course.findFirst.mockResolvedValue({
        id: 'course-exist',
        code: 'MATH101',
      });

      await expect(
        service.create('tenant-1', 'user-1', {
          programId: 'program-1',
          name: 'Mathematics',
          code: 'MATH101',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update course details successfully', async () => {
      const existing = { id: 'course-1', code: 'MATH101', name: 'Math' };
      prisma.course.findFirst.mockResolvedValue(existing);
      prisma.course.update.mockResolvedValue({ ...existing, name: 'Math Rev' });

      const result = await service.update('tenant-1', 'user-1', 'course-1', {
        name: 'Math Rev',
      });

      expect(prisma.course.update).toHaveBeenCalled();
      expect(result.name).toBe('Math Rev');
    });

    it('should block duplicate course codes on update', async () => {
      const existing = { id: 'course-1', code: 'MATH101' };
      prisma.course.findFirst
        .mockResolvedValueOnce(existing) // for existing check
        .mockResolvedValueOnce({ id: 'course-other', code: 'MATH102' }); // for duplicate check

      await expect(
        service.update('tenant-1', 'user-1', 'course-1', {
          code: 'MATH102',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('attaches teachers scoped by class-course assignments', async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: 'course-1',
        name: 'Mathematics',
        program: { id: 'program-1', name: 'Science', code: 'SCI', classes: [] },
      });
      prisma.classInstructorCourse.findMany.mockResolvedValue([
        {
          classInstructor: {
            class: { id: 'class-1', name: 'Class A' },
            membership: {
              id: 'membership-1',
              user: {
                id: 'user-1',
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
              },
            },
          },
        },
      ]);

      const result = await service.findOne('tenant-1', 'course-1');

      expect(prisma.classInstructorCourse.findMany).toHaveBeenCalledWith({
        where: {
          courseId: 'course-1',
          tenantId: 'tenant-1',
          deletedAt: null,
          classInstructor: {
            deletedAt: null,
            class: { deletedAt: null },
          },
        },
        include: expect.any(Object),
      });
      expect(result.teachers).toEqual([
        {
          membershipId: 'membership-1',
          userId: 'user-1',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          classId: 'class-1',
          className: 'Class A',
        },
      ]);
    });
  });

  describe('remove', () => {
    it('should soft delete successfully if no classes are scheduled for the program', async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: 'course-1',
        programId: 'program-1',
      });
      prisma.class.count.mockResolvedValue(0);
      prisma.course.update.mockResolvedValue({
        id: 'course-1',
        deletedAt: new Date(),
      });

      await service.remove('tenant-1', 'user-1', 'course-1');

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: {
          deletedAt: expect.any(Date),
          updatedBy: 'user-1',
        },
      });
    });

    it('should block soft delete if classes are scheduled for the course program', async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: 'course-1',
        programId: 'program-1',
      });
      prisma.class.count.mockResolvedValue(2); // 2 active sections exist

      await expect(
        service.remove('tenant-1', 'user-1', 'course-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
