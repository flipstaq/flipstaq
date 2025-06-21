import { Module } from "@nestjs/common";
import { ReportModule } from "./report/report.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [CommonModule, ReportModule],
})
export class AppModule {}
