import { Module } from '@nestjs/common';

import { MemberImportModule } from '../member-import/member-import.module';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';

@Module({
  imports: [MemberImportModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
