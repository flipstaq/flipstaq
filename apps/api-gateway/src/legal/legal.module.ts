import { Module } from "@nestjs/common";
import { LegalGatewayController } from "./legal-gateway.controller";
import { ProxyService } from "../proxy/proxy.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [LegalGatewayController],
  providers: [ProxyService],
})
export class LegalModule {}
