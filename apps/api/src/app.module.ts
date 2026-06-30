import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaModule } from 'nestjs-prisma';
import * as path from 'path';
import { Pool } from 'pg';

import { AcademicTermsModule } from './academic-terms/academic-terms.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AtGuard } from './common/guards/at.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { ProgramsModule } from './programs/programs.module';
import { RolesModule } from './roles/roles.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '..', '.env'),
        path.resolve(__dirname, '..', '..', '..', '.env'),
      ],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error(
            'DATABASE_URL is not set. Add it to apps/api/.env (local dev) or the container environment (Docker).',
          );
        }
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
    TenantsModule,
    RolesModule,
    AcademicTermsModule,
    ProgramsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
