import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ReportGatewayController } from "./report-gateway.controller";
import { ProxyService } from "../proxy/proxy.service";

@Module({
  imports: [HttpModule],
  controllers: [ReportGatewayController],
  providers: [ProxyService],
})
export class ReportModule {}
