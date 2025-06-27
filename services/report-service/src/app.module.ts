import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ReportModule } from "./report/report.module";
import { CommonModule } from "./common/common.module";
import { RateLimitMiddleware } from "./common/middleware/rate-limit.middleware";
import { ReportRateLimitMiddleware } from "./common/middleware/report-rate-limit.middleware";

@Module({
  imports: [CommonModule, ReportModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply global rate limiting first
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });

    // Apply report-specific rate limiting
    consumer
      .apply(ReportRateLimitMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
