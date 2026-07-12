import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import {
  MEMBER_IMPORT_QUEUE,
  MemberImportJobData,
  MemberImportResult,
} from './member-import.constants';
import { MemberImportService } from './member-import.service';

/**
 * Background worker for CSV member imports (students & parents). The parsing,
 * validation, and account creation live in MemberImportService — the same code
 * path the unit tests cover — so this processor is a thin adapter.
 *
 * A thrown error marks the job failed; its message becomes `failedReason`,
 * which the status endpoint relays to the client.
 */
@Processor(MEMBER_IMPORT_QUEUE)
export class MemberImportProcessor extends WorkerHost {
  private readonly logger = new Logger(MemberImportProcessor.name);

  constructor(private readonly memberImportService: MemberImportService) {
    super();
  }

  async process(job: Job<MemberImportJobData>): Promise<MemberImportResult> {
    this.logger.log(
      `Processing ${job.data.role} import job ${job.id} for tenant ${job.data.tenantId}`,
    );

    const result = await this.memberImportService.processImport(job.data);

    await job.updateProgress(100);
    return result;
  }
}
