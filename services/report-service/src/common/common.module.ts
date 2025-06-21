import { Module, Global } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { InternalServiceMiddleware } from "./internal-service.middleware";

@Global()
@Module({
  providers: [PrismaService, InternalServiceMiddleware],
  exports: [PrismaService, InternalServiceMiddleware],
})
export class CommonModule {}
