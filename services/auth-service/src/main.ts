import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // No global prefix needed since controller has full internal path
  // Enable CORS for internal communication (API Gateway only)
  app.enableCors({
    origin: [
      'http://localhost:3100', // API Gateway (primary)
      'http://localhost:3000', // Development frontend (fallback)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  ); // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Flipstaq Auth Service')
    .setDescription(
      '🔒 Authentication microservice for Flipstaq platform\n\nPublic routes (/auth/*) for API Gateway\nInternal routes (/internal/auth/*) for microservice communication',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Development Server')
    .addTag('Auth', 'Public authentication endpoints for API Gateway')
    .addTag('Internal Auth', 'Internal authentication endpoints for microservice communication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Auth Service running on: http://localhost:${port}`);
  console.log(`📚 Public API available at: http://localhost:${port}/auth`);
  console.log(`📚 Internal API available at: http://localhost:${port}/internal/auth`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  console.log(
    `⚠️  Public routes should be accessed via API Gateway at http://localhost:3100/api/v1/auth`,
  );
}

bootstrap();
