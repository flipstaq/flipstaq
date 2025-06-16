import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { getCurrentApiPath } from "./common/config/api-version.config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure Express to handle larger payloads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Configure body parsing limits for file uploads
  app.use("/api/v1/products", (req: any, res: any, next: any) => {
    // Increase limit for product creation endpoint with potential file uploads
    if (req.method === "POST") {
      req.setTimeout(60000); // 60 seconds timeout
    }
    next();
  }); // Ensure uploads directory exists
  const uploadsPath = join(__dirname, "..", "src", "uploads", "products");
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }

  // Serve static files for uploads (from src/uploads in development, dist/uploads in production)
  const staticPath =
    process.env.NODE_ENV === "production"
      ? join(__dirname, "uploads")
      : join(__dirname, "..", "src", "uploads");

  app.useStaticAssets(staticPath, {
    prefix: "/uploads/",
  });

  // Set global API prefix (api/v1)
  app.setGlobalPrefix(getCurrentApiPath());

  // Enable CORS for frontend communication
  const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "Cache-Control",
      "Pragma",
      "X-Requested-With",
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("FlipStaq API Gateway")
    .setDescription("Central API Gateway for FlipStaq eCommerce platform")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3100;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 API Gateway running on: http://localhost:${port}`);
  console.log(`📚 Public API available at: http://localhost:${port}/api/v1`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`
  );
  console.log(`🔗 CORS enabled for: ${corsOrigins.join(", ")}`);
}

bootstrap();
