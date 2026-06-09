import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const appDomain = configService.get<string>('APP_DOMAIN') || 'localhost';

  app.set('trust proxy', true);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gurukul API')
    .setDescription(
      'The Gurukul API provides core backend services for user accounts, workspace ' +
        'management, academic calendars, and role-based access control.\n\n' +
        '### Multi-Tenancy & Subdomain Routing\n' +
        'This API is designed for multi-tenant deployments. Tenants (workspaces) are resolved ' +
        'dynamically using the request hostname subdomain (e.g., `school-name.example.com`). ' +
        'To test tenant-specific endpoints, queries must route to the corresponding tenant subdomain. ' +
        'Endpoint access across subdomains is automatically verified and restricted.\n\n' +
        '### Authentication System\n' +
        'Security relies on stateless JWT Access Tokens and database-backed Refresh Tokens:\n' +
        '- **Access Tokens:** Must be sent in the `Authorization` header as `Bearer <JWT_ACCESS_TOKEN>`. Expires in 15 minutes.\n' +
        '- **Refresh Tokens:** Handled via secure HTTP-only cookies (`refreshToken`) for session refresh and rotation. Alternatively, the refresh token can be passed in the authorization header on the refresh endpoint.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description:
        'Enter your JWT access token to authorize calls to protected routes.',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const escapedDomain = appDomain.replace(/\./g, '\\.');
  const originRegex = new RegExp(
    `^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*${escapedDomain}(?::\\d+)?$`,
    'i',
  );
  const isDev = configService.get<string>('NODE_ENV') !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (originRegex.test(origin)) return callback(null, true);
      if (
        isDev &&
        (origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  const port = configService.get<number>('PORT') ?? 8000;
  await app.listen(port);
  Logger.log(`Backend is running on port: ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error(err, 'Bootstrap');
  process.exit(1);
});
