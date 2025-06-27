import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LegalService } from "./legal.service";
import { LegalController } from "./legal.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { RolesGuard } from "../common/guards/roles.guard";

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          "JWT_SECRET",
          "your-super-secret-jwt-key-change-this-in-production"
        ),
        signOptions: { expiresIn: "1h" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LegalController],
  providers: [LegalService, RolesGuard],
  exports: [LegalService],
})
export class LegalModule {}
