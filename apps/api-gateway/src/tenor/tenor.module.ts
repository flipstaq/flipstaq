import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TenorService } from "./tenor.service";
import { TenorController } from "./tenor.controller";

@Module({
  imports: [ConfigModule],
  controllers: [TenorController],
  providers: [TenorService],
  exports: [TenorService],
})
export class TenorModule {}
