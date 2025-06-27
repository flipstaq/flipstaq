import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { PublicUserController } from './public/public-user.controller';
import { PrismaModule } from './prisma/prisma.module';
import { InternalServiceMiddleware } from './common/middleware/internal-service.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes in milliseconds
        limit: 100, // 100 requests per 15 minutes
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
  ],
  controllers: [PublicUserController], // Public controller not subject to internal middleware
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply internal service middleware only to internal routes
    consumer
      .apply(InternalServiceMiddleware)
      .forRoutes({ path: 'internal/*', method: RequestMethod.ALL });
  }
}
