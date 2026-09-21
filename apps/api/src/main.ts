import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Basic HTTP security headers
  app.use(helmet());

  // API Route Prefix (/api/v1)
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Config Service
  const configService = app.get(ConfigService);

  // CORS Configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  const origins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : corsOrigin;

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = configService.get<number>('PORT') ?? 4000;
  await app.listen(port);
  logger.log(`Rivo API is running on: http://localhost:${port}/api/v1`);
}

await bootstrap();
