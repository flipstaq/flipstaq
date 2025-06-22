import { Module, MiddlewareConsumer } from "@nestjs/common";
import { MessageModule } from "./message/message.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { InternalServiceMiddleware } from "./common/middleware/internal-service.middleware";
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
        expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      },
    }),
  ],
  providers: [MessagingGateway], // Your custom WebSocket implementation
  exports: [MessagingGateway],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InternalServiceMiddleware).forRoutes("*");
  }
}
