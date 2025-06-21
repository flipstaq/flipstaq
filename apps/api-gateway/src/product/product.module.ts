import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ProductGatewayController } from "./product-gateway.controller";
import { ProxyService } from "../proxy/proxy.service";
import { OptionalAuthMiddleware } from "../common/middleware/optional-auth.middleware";

@Module({
  imports: [HttpModule, JwtModule],
  controllers: [ProductGatewayController],
  providers: [ProxyService, OptionalAuthMiddleware],
})
export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OptionalAuthMiddleware).forRoutes(ProductGatewayController);
  }
}
