import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AtStrategy, RtStrategy } from './strategies';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, AtStrategy, RtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
