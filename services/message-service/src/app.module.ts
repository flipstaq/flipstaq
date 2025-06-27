import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { MessageModule } from "./message/message.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { InternalServiceMiddleware } from "./common/middleware/internal-service.middleware";
import { RateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { MessageRateLimitMiddleware } from "./common/middleware/message-rate-limit.middleware";
import { JwtModule } from "@nestjs/jwt";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { MessagingGateway } from "./gateway/messaging.gateway";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    MessageModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersupersecretCEMal",
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m",
      },
    }),
  ],
  providers: [
    MessagingGateway, // Your custom WebSocket implementation
  ],
  exports: [MessagingGateway],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply global rate limiting first
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });

    // Apply message-specific rate limiting
    consumer
      .apply(MessageRateLimitMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });

    // Apply internal service middleware last
    consumer.apply(InternalServiceMiddleware).forRoutes("*");
  }
}
