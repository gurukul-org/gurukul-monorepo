import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EmailModule } from '../email/email.module';
import { AtStrategy, RtStrategy } from './strategies';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PassportModule, JwtModule.register({}), EmailModule],
  controllers: [UsersController],
  providers: [UsersService, AtStrategy, RtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
