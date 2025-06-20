import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user/user.module';
import { PublicUserController } from './public/public-user.controller';
import { PrismaModule } from './prisma/prisma.module';
import { InternalServiceMiddleware } from './common/middleware/internal-service.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
  ],
  controllers: [PublicUserController], // Public controller not subject to internal middleware
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply internal service middleware only to internal routes
    consumer
      .apply(InternalServiceMiddleware)
      .forRoutes({ path: 'internal/*', method: RequestMethod.ALL });
  }
}
