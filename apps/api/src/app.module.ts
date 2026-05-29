import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaModule } from 'nestjs-prisma';
import { Pool } from 'pg';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtGuard } from './common/guards/at.guard';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return {
          explicitConnect: true,
          prismaOptions: {
            adapter,
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}
