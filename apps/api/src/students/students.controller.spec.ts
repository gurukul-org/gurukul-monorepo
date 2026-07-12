import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MemberImportService } from '../member-import/member-import.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-123';
const ACTOR = { scopes: ['invite-students'], isAdmin: false };

// Builds a minimal multer-style file object for the endpoint.
const csvFile = (content: string, originalname = 'students.csv') => ({
  buffer: Buffer.from(content),
  originalname,
  mimetype: 'text/csv',
  size: content.length,
});

describe('StudentsController (bulk import)', () => {
  let controller: StudentsController;
  let memberImport: { enqueue: jest.Mock; getStatus: jest.Mock };

  beforeEach(async () => {
    memberImport = { enqueue: jest.fn(), getStatus: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: StudentsService, useValue: {} },
        { provide: MemberImportService, useValue: memberImport },
      ],
    }).compile();

    controller = moduleRef.get(StudentsController);
  });

  describe('bulkCreate (enqueue)', () => {
    it('enqueues a student import and returns the job id', async () => {
      memberImport.enqueue.mockResolvedValueOnce({ jobId: 'job-1' });

      const res = await controller.bulkCreate(
        TENANT_ID,
        USER_ID,
        ACTOR,
        csvFile('email,firstName,lastName\na@x.com,Aarav,Sharma'),
      );

      expect(res).toEqual({ jobId: 'job-1' });
      expect(memberImport.enqueue).toHaveBeenCalledTimes(1);

      const [payload] = memberImport.enqueue.mock.calls[0] as [
        {
          role: string;
          tenantId: string;
          userId: string;
          scopes: string[];
          isAdmin: boolean;
          csvContent: string;
        },
      ];
      expect(payload).toMatchObject({
        role: 'student',
        tenantId: TENANT_ID,
        userId: USER_ID,
        scopes: ACTOR.scopes,
        isAdmin: ACTOR.isAdmin,
      });
      expect(payload.csvContent).toContain('a@x.com');
    });

    it('rejects when no file is provided', async () => {
      await expect(
        controller.bulkCreate(TENANT_ID, USER_ID, ACTOR, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(memberImport.enqueue).not.toHaveBeenCalled();
    });

    it('rejects a non-CSV file', async () => {
      await expect(
        controller.bulkCreate(TENANT_ID, USER_ID, ACTOR, {
          ...csvFile('data', 'students.txt'),
          mimetype: 'text/plain',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty file', async () => {
      await expect(
        controller.bulkCreate(TENANT_ID, USER_ID, ACTOR, csvFile('   \n')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getImportStatus', () => {
    it('delegates to the import service', async () => {
      const status = { jobId: 'job-1', state: 'completed', progress: 100 };
      memberImport.getStatus.mockResolvedValueOnce(status);

      const res = await controller.getImportStatus(TENANT_ID, 'job-1');

      expect(res).toBe(status);
      expect(memberImport.getStatus).toHaveBeenCalledWith(TENANT_ID, 'job-1');
    });
  });
});
