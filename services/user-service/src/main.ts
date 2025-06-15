import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for internal communication (API Gateway only)
  app.enableCors({
    origin: [
      "http://localhost:3100", // API Gateway (primary)
      "http://localhost:3000", // Development frontend (fallback)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Internal Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("FlipStaq User Service - Internal API")
    .setDescription(
      "🔒 Internal user management microservice - DO NOT EXPOSE PUBLICLY\nAccess via API Gateway at http://localhost:3100/api/v1/users/*"
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addServer(
      `http://localhost:${process.env.PORT || 3002}`,
      "Internal Development Server (Gateway Access Only)"
    )
    .addTag(
      "Internal User Management",
      "Internal user management endpoints for admin operations"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(
    `🚀 User Service (Internal) running on: http://localhost:${port}`
  );
  console.log(
    `📚 Internal API available at: http://localhost:${port}/internal`
  );
  console.log(
    `📚 Internal Swagger docs available at: http://localhost:${port}/api/docs`
  );
  console.log(
    `⚠️  This service should only be accessed via the API Gateway for external requests`
  );
}

bootstrap();
