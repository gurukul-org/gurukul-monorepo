import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(`Backend is running on port: ${port}`);
}
bootstrap().catch(console.error);
