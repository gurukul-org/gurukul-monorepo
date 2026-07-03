import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { InvitationsModule } from '../tenants/invitations/invitations.module';
import { MEMBER_IMPORT_QUEUE } from './member-import.constants';
import { MemberImportProcessor } from './member-import.processor';
import { MemberImportService } from './member-import.service';

/**
 * Shared CSV bulk-import feature. Imported by StudentsModule and ParentsModule,
 * which inject MemberImportService in their controllers to enqueue imports and
 * read job status. Both delegate here so the parse/validate/create logic lives
 * in exactly one place.
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: MEMBER_IMPORT_QUEUE }),
    InvitationsModule,
  ],
  providers: [MemberImportService, MemberImportProcessor],
  exports: [MemberImportService],
})
export class MemberImportModule {}
