import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AtStrategy, RtStrategy } from './strategies';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, AtStrategy, RtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
