import { Module, MiddlewareConsumer } from "@nestjs/common";
import { MessageModule } from "./message/message.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { WebSocketModule } from "./websocket/websocket.module";
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
    WebSocketModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "supersupersecretCEMal",
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || "2h",
      },
    }),
  ],
  providers: [MessagingGateway], // Make MessagingGateway available at app level
  exports: [MessagingGateway],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InternalServiceMiddleware).forRoutes("*");
  }
}
