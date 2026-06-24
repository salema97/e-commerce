import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { ErrorTracker } from './analytics/error-tracker.interface.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useBodyParser('json', {
    verify: (req: { rawBody?: Buffer }, res: unknown, buf: Buffer) => {
      req.rawBody = buf;
    },
  });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost), app.get(ErrorTracker)),
  );
  const configService = app.get(ConfigService);

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('REST API for the e-commerce platform')
    .setVersion('1.0')
    .addTag('Health')
    .addTag('Categories')
    .addTag('Products')
    .addTag('Inventory')
    .addTag('Suppliers')
    .addTag('Users')
    .addTag('Cart')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('Invoices')
    .addTag('Returns')
    .addTag('Finance')
    .addTag('Notifications')
    .addTag('Marketing')
    .addTag('Analytics')
    .addTag('AI')
    .addTag('WhatsApp')
    .addTag('Webhooks')
    .addTag('Auth')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(configService.get('PORT', '3001'), 10);

  await app.listen(port);
}

bootstrap();
