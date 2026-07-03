import { Module } from '@nestjs/common';

import { MemberImportModule } from '../member-import/member-import.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [MemberImportModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
