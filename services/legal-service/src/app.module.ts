import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { LegalModule } from "./legal/legal.module";
import { PrismaModule } from "./prisma/prisma.module";
import { InternalServiceMiddleware } from "./common/middleware/internal-service.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests per 15 minutes
      },
    ]),
    PrismaModule,
    LegalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply internal service middleware to internal routes
    consumer
      .apply(InternalServiceMiddleware)
      .forRoutes({ path: "internal/*", method: RequestMethod.ALL });
  }
}
