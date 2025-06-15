import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./user/user.module";
import { PrismaModule } from "./prisma/prisma.module";
import { InternalServiceMiddleware } from "./common/middleware/internal-service.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply internal service middleware to all routes
    consumer
      .apply(InternalServiceMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
