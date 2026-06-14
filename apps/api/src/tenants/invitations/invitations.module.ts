import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { EmailService } from '../../email/email.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
