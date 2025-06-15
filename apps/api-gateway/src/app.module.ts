import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthGatewayController } from "./auth/auth-gateway.controller";
import { UserGatewayController } from "./user/user-gateway.controller";
import { ProxyService } from "./proxy/proxy.service";
import { JwtStrategy } from "./common/strategies/jwt.strategy";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "15m"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthGatewayController, UserGatewayController],
  providers: [ProxyService, JwtStrategy],
})
export class AppModule {}
