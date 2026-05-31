import { MiddlewareConsumer, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantsMiddleware } from './tenants.middleware';
import { TenantsService } from './tenants.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantsMiddleware).forRoutes('*');
  }
}
