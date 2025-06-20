import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { MessagingGateway } from "./gateway/messaging.gateway";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for API Gateway communication
  app.enableCors({
    origin: ["http://localhost:3100", "http://localhost:3000"], // API Gateway and Frontend
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT || 3003;
  await app.listen(port);

  // Initialize WebSocket server on a separate port
  try {
    const messagingGateway = app.get(MessagingGateway);
    messagingGateway.initialize(); // This will create its own HTTP server on port 8001
  } catch (error) {
    console.error("Failed to initialize WebSocket Gateway:", error.message);
    console.log("The service will continue without WebSocket functionality");
  }

  console.log(
    `🚀 Message Service (Internal) running on: http://localhost:${port}`
  );
  console.log(`🔌 WebSocket Gateway available at: ws://localhost:8001/ws`);
  console.log(
    `📚 Internal API available at: http://localhost:${port}/internal`
  );
  console.log(
    `⚠️  This service should only be accessed via the API Gateway for external requests`
  );
}

bootstrap();
