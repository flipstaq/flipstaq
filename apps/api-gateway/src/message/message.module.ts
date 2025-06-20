import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MessageGatewayController } from "./message-gateway.controller";
import { ProxyService } from "../proxy/proxy.service";

@Module({
  imports: [HttpModule],
  controllers: [MessageGatewayController],
  providers: [ProxyService],
})
export class MessageModule {}
