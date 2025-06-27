import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthGatewayController } from "./auth/auth-gateway.controller";
import { UserGatewayController } from "./user/user-gateway.controller";
import { PublicController } from "./public/public.controller";
import { ProductModule } from "./product/product.module";
import { MessageModule } from "./message/message.module";
import { TenorModule } from "./tenor/tenor.module";
import { ReportModule } from "./report/report.module";
import { ProxyService } from "./proxy/proxy.service";
import { JwtStrategy } from "./common/strategies/jwt.strategy";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes in milliseconds
        limit: 200, // 200 requests per 15 minutes (higher for gateway)
      },
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          "JWT_SECRET",
          "your-super-secret-jwt-key-change-this-in-production"
        ),
        signOptions: {
          expiresIn: configService.get<string>(
            "JWT_ACCESS_TOKEN_EXPIRY",
            "15m"
          ),
        },
      }),
      inject: [ConfigService],
    }),
    ProductModule,
    MessageModule,
    TenorModule,
    ReportModule,
  ],
  controllers: [AuthGatewayController, UserGatewayController, PublicController],
  providers: [
    ProxyService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
