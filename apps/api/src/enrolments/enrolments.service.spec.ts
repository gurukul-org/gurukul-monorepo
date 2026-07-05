import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from 'nestjs-prisma';

import { EnrolmentsService } from './enrolments.service';

type PrismaMock = {
  enrolment: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  studentProfile: {
    findFirst: jest.Mock;
  };
  class: {
    findFirst: jest.Mock;
  };
};

const USER_ID = 'user-123';
const TENANT_ID = 'tenant-123';
const STUDENT_ID = 'student-1';
const CLASS_ID = 'class-1';
const ENROLMENT_ID = 'enrolment-1';

/** Helper: builds a fully-populated enrolment row that findOne includes */
const makeFindOneRow = (overrides: Record<string, any> = {}) => ({
  id: ENROLMENT_ID,
  status: 'ACTIVE',
  enrolledAt: new Date(),
  withdrawReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  student: {
    id: STUDENT_ID,
    rollNumber: 'R001',
    status: 'ACTIVE',
    membership: {
      user: {
        id: USER_ID,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
    },
  },
  class: {
    id: CLASS_ID,
    name: 'Math 101',
    maxCapacity: 30,
    status: 'ACTIVE',
    program: { id: 'prog-1', name: 'Mathematics', code: 'MATH' },
    academicTerm: { id: 'term-1', name: 'Fall 2026' },
  },
  ...overrides,
});

/** Helper: the class row returned by prisma.class.findFirst during create */
const makeClassRow = (overrides: Record<string, any> = {}) => ({
  id: CLASS_ID,
  name: 'Math 101',
  maxCapacity: 30,
  status: 'ACTIVE',
  tenantId: TENANT_ID,
  deletedAt: null,
  academicTerm: { id: 'term-1', deletedAt: null, isActive: true },
  _count: { enrolments: 5 },
  ...overrides,
});

describe('EnrolmentsService', () => {
  let service: EnrolmentsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = {
      enrolment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: {
        findFirst: jest.fn(),
      },
      class: {
        findFirst: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EnrolmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(EnrolmentsService);
  });

  // ---------------------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const dto = { studentProfileId: STUDENT_ID, classId: CLASS_ID };

    /** Sets up a full happy-path mock chain for create */
    const setupCreateHappyPath = () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: STUDENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.class.findFirst.mockResolvedValueOnce(makeClassRow());
      prisma.enrolment.findFirst.mockResolvedValueOnce(null); // no duplicate
      prisma.enrolment.create.mockResolvedValueOnce({
        id: ENROLMENT_ID,
        status: 'ACTIVE',
      });
    };

    it('creates an enrolment successfully', async () => {
      setupCreateHappyPath();

      // findOne called at the end of create
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: ENROLMENT_ID,
        status: 'ACTIVE',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.create(TENANT_ID, USER_ID, dto);

      expect(res.id).toBe(ENROLMENT_ID);
      expect(res.status).toBe('ACTIVE');
      expect(prisma.enrolment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          studentProfileId: STUDENT_ID,
          classId: CLASS_ID,
          status: 'ACTIVE',
          createdBy: USER_ID,
        }),
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(logSpy.mock.calls[0][0]);
      expect(logVal.action).toBe('CREATE_ENROLMENT');
    });

    it('rejects when class academic term is archived', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: STUDENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.class.findFirst.mockResolvedValueOnce(
        makeClassRow({
          academicTerm: {
            id: 'term-1',
            deletedAt: new Date(),
            isActive: false,
          },
        }),
      );

      await expect(service.create(TENANT_ID, USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when class is at capacity', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: STUDENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.class.findFirst.mockResolvedValueOnce(
        makeClassRow({ maxCapacity: 5, _count: { enrolments: 5 } }),
      );

      await expect(service.create(TENANT_ID, USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate ACTIVE enrolment', async () => {
      prisma.studentProfile.findFirst.mockResolvedValueOnce({
        id: STUDENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.class.findFirst.mockResolvedValueOnce(makeClassRow());
      prisma.enrolment.findFirst.mockResolvedValueOnce({
        id: 'existing-enrolment',
        status: 'ACTIVE',
      });

      await expect(service.create(TENANT_ID, USER_ID, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows re-enrol when previous enrolment is WITHDRAWN', async () => {
      setupCreateHappyPath(); // duplicate check returns null (no ACTIVE dup)

      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: ENROLMENT_ID,
        status: 'ACTIVE',
      } as any);

      const res = await service.create(TENANT_ID, USER_ID, dto);

      expect(res.id).toBe(ENROLMENT_ID);
      expect(res.status).toBe('ACTIVE');
    });
  });

  // ---------------------------------------------------------------------------
  // bulkCreate()
  // ---------------------------------------------------------------------------
  describe('bulkCreate', () => {
    it('returns partial success — some succeed, some fail', async () => {
      const bulkDto = {
        classId: CLASS_ID,
        studentProfileIds: ['stu-ok', 'stu-fail'],
      };

      // Spy on create — first call succeeds, second fails
      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce({ id: 'e-ok', status: 'ACTIVE' } as any)
        .mockRejectedValueOnce(
          new ConflictException(
            'This student already has an active enrolment in this class.',
          ),
        );

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.bulkCreate(TENANT_ID, USER_ID, bulkDto);

      expect(res.succeeded).toHaveLength(1);
      expect(res.succeeded[0]).toEqual({
        studentProfileId: 'stu-ok',
        enrolmentId: 'e-ok',
      });
      expect(res.failed).toHaveLength(1);
      expect(res.failed[0].studentProfileId).toBe('stu-fail');
      expect(res.failed[0].reason).toContain('active enrolment');
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(logSpy.mock.calls[0][0]);
      expect(logVal.action).toBe('BULK_CREATE_ENROLMENT');
      expect(logVal.succeeded).toBe(1);
      expect(logVal.failed).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // withdraw()
  // ---------------------------------------------------------------------------
  describe('withdraw', () => {
    it('sets status to WITHDRAWN and preserves record (no deletedAt)', async () => {
      prisma.enrolment.findFirst.mockResolvedValueOnce({
        id: ENROLMENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
      });

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.withdraw(
        TENANT_ID,
        USER_ID,
        ENROLMENT_ID,
        'Family relocated',
      );

      expect(res.message).toContain('withdrawn');
      expect(prisma.enrolment.update).toHaveBeenCalledWith({
        where: { id: ENROLMENT_ID },
        data: {
          status: 'WITHDRAWN',
          withdrawReason: 'Family relocated',
        },
      });
      // Must NOT set deletedAt
      const updateCall = prisma.enrolment.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('deletedAt');
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(logSpy.mock.calls[0][0]);
      expect(logVal.action).toBe('WITHDRAW_ENROLMENT');
    });
  });

  // ---------------------------------------------------------------------------
  // update()
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('rejects invalid status transition from COMPLETED', async () => {
      prisma.enrolment.findFirst.mockResolvedValueOnce({
        id: ENROLMENT_ID,
        tenantId: TENANT_ID,
        status: 'COMPLETED',
      });

      await expect(
        service.update(TENANT_ID, USER_ID, ENROLMENT_ID, {
          status: 'WITHDRAWN',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully transitions ACTIVE → COMPLETED', async () => {
      prisma.enrolment.findFirst.mockResolvedValueOnce({
        id: ENROLMENT_ID,
        tenantId: TENANT_ID,
        status: 'ACTIVE',
      });

      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: ENROLMENT_ID,
        status: 'COMPLETED',
      } as any);

      const logSpy = jest.spyOn(service['logger'], 'log');

      const res = await service.update(TENANT_ID, USER_ID, ENROLMENT_ID, {
        status: 'COMPLETED',
      });

      expect(res.status).toBe('COMPLETED');
      expect(prisma.enrolment.update).toHaveBeenCalledWith({
        where: { id: ENROLMENT_ID },
        data: { status: 'COMPLETED' },
      });
      expect(logSpy).toHaveBeenCalled();
      const logVal = JSON.parse(logSpy.mock.calls[0][0]);
      expect(logVal.action).toBe('COMPLETE_ENROLMENT');
      expect(logVal.previousStatus).toBe('ACTIVE');
      expect(logVal.newStatus).toBe('COMPLETED');
    });
  });
});
