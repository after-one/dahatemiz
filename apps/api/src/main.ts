/**
 * API Application Bootstrap
 *
 * Configures and starts the NestJS application with:
 * - Global validation pipe
 * - OpenAPI/Swagger documentation
 * - Global error handling
 * - CORS
 * - Request logging
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });
  app.use(helmet());

  const apiPrefix = process.env['API_PREFIX'] ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe — strict mode, no unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  // CORS — restrict to configured origins in production
  const corsOrigins = (process.env['CORS_ORIGINS'] ?? 'http://localhost:8081')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // OpenAPI documentation
  if (process.env['NODE_ENV'] !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DahaMiz API')
      .setDescription('Environmental accountability and community platform API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('health', 'Health and readiness checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    logger.log(`Swagger UI available at /${apiPrefix}/docs`);
  }

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  await app.listen(port);

  logger.log(`API listening on port ${port}`);
  logger.log(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
}

void bootstrap();
