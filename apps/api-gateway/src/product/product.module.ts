import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProductGatewayController } from "./product-gateway.controller";
import { ProxyService } from "../proxy/proxy.service";

@Module({
  imports: [HttpModule],
  controllers: [ProductGatewayController],
  providers: [ProxyService],
})
export class ProductModule {}
