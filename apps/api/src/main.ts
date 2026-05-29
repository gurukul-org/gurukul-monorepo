import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appDomain = configService.get<string>('APP_DOMAIN') || 'localhost';

  // 1. Enable cookie parsing
  app.use(cookieParser());

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. Dynamic CORS matching for base domain and wildcards/subdomains
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Escape base domain dot separator for regex matching
      const escapedDomain = appDomain.replace(/\./g, '\\.');

      // Matches: http(s)://domain, http(s)://sub.domain, http(s)://sub.sub.domain (with optional ports)
      const originRegex = new RegExp(
        `^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*${escapedDomain}(?::\\d+)?$`,
      );

      if (originRegex.test(origin)) {
        callback(null, true);
      } else {
        // Fallback for dev: always allow local origins if in non-production mode
        const isDev = configService.get<string>('NODE_ENV') !== 'production';
        if (
          isDev &&
          (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:'))
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  });

  const port = configService.get<number>('PORT') ?? 8000;
  await app.listen(port);
  console.log(`Backend is running on port: ${port}`);
}
bootstrap().catch(console.error);
