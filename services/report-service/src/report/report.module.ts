import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ReportController } from "./report.controller";
import { ReportService } from "./report.service";
import { InternalServiceMiddleware } from "../common/internal-service.middleware";

@Module({
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(InternalServiceMiddleware)
      .forRoutes(
        { path: "internal/reports", method: RequestMethod.POST },
        { path: "internal/reports", method: RequestMethod.GET },
        { path: "internal/reports/:id/resolve", method: RequestMethod.PATCH }
      );
  }
}
