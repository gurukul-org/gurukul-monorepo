import { MiddlewareConsumer, Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { TenantsController } from './tenants.controller';
import { TenantsMiddleware } from './tenants.middleware';
import { TenantsService } from './tenants.service';

@Module({
  imports: [UsersModule, InvitationsModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantsMiddleware).forRoutes('*');
  }
}
