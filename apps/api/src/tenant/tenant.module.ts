import { MiddlewareConsumer, Module } from '@nestjs/common';

import { TenantMiddleware } from './tenant.middleware';
import { TenantService } from './tenant.service';

@Module({
  providers: [TenantService],
})
export class TenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
