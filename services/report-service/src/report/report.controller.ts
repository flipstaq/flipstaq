import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { ReportService } from "./report.service";
import { CreateReportDto, ReportResponseDto } from "./dto/report.dto";
import { ReportType, ReportStatus, UserRole } from "@flipstaq/db";
import { PrismaService } from "../common/prisma.service";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("internal/reports")
export class ReportController {
  constructor(
    private reportService: ReportService,
    private prisma: PrismaService
  ) {}

  @Post()
  @ApiOperation({ summary: "Submit a report" })
  @ApiResponse({
    status: 201,
    description: "Report submitted successfully",
    type: ReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request or already reported",
  })
  @ApiResponse({ status: 409, description: "Already reported this item" })
  async createReport(
    @Body() createReportDto: CreateReportDto,
    @Req() req: Request
  ): Promise<ReportResponseDto> {
    const userId = req.headers["x-user-id"] as string;
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

    return this.reportService.createReport(userId, createReportDto, ipAddress);
  }
  @Get()
  @ApiOperation({ summary: "Get all reports (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports retrieved successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async getReports(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: ReportStatus,
    @Query("type") type?: ReportType,
    @Query("reporterUsername") reporterUsername?: string,
    @Query("reporterId") reporterId?: string,
    @Query("targetUsername") targetUsername?: string,
    @Query("targetId") targetId?: string,
    @Query("reason") reason?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("ipAddress") ipAddress?: string,
    @Query("resolvedBy") resolvedBy?: string
  ) {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    const pageNum = parseInt(page || "1", 10);
    const limitNum = parseInt(limit || "20", 10);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException("Invalid pagination parameters");
    }

    const filters = {
      reporterUsername,
      reporterId,
      targetUsername,
      targetId,
      reason,
      dateFrom,
      dateTo,
      ipAddress,
      resolvedBy,
    };

    return this.reportService.getReports(
      pageNum,
      limitNum,
      status,
      type,
      filters
    );
  }

  @Patch(":id/resolve")
  @ApiOperation({ summary: "Resolve a report (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Report resolved successfully",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  async resolveReport(
    @Param("id") reportId: string,
    @Req() req: Request
  ): Promise<ReportResponseDto> {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    return this.reportService.resolveReport(reportId, userId);
  }
  @Patch(":id/dismiss")
  @ApiOperation({ summary: "Dismiss a report (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Report dismissed successfully",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  async dismissReport(
    @Param("id") reportId: string,
    @Req() req: Request
  ): Promise<ReportResponseDto> {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    return this.reportService.dismissReport(reportId, userId);
  }

  @Patch(":id/under-review")
  @ApiOperation({ summary: "Set a report as under review (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Report set to under review successfully",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  async setUnderReview(
    @Param("id") reportId: string,
    @Req() req: Request
  ): Promise<ReportResponseDto> {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    return this.reportService.setUnderReview(reportId, userId);
  }

  @Get("export/json")
  @ApiOperation({ summary: "Export reports as JSON (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async exportReportsJson(
    @Req() req: Request,
    @Query("status") status?: ReportStatus,
    @Query("type") type?: ReportType,
    @Query("reporterUsername") reporterUsername?: string,
    @Query("reporterId") reporterId?: string,
    @Query("targetUsername") targetUsername?: string,
    @Query("targetId") targetId?: string,
    @Query("reason") reason?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("ipAddress") ipAddress?: string,
    @Query("resolvedBy") resolvedBy?: string
  ) {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    const filters = {
      reporterUsername,
      reporterId,
      targetUsername,
      targetId,
      reason,
      dateFrom,
      dateTo,
      ipAddress,
      resolvedBy,
    };

    return this.reportService.exportReportsJson(status, type, filters);
  }

  @Get("export/html")
  @ApiOperation({ summary: "Export reports as HTML (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async exportReportsHtml(
    @Req() req: Request,
    @Query("status") status?: ReportStatus,
    @Query("type") type?: ReportType,
    @Query("reporterUsername") reporterUsername?: string,
    @Query("reporterId") reporterId?: string,
    @Query("targetUsername") targetUsername?: string,
    @Query("targetId") targetId?: string,
    @Query("reason") reason?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("ipAddress") ipAddress?: string,
    @Query("resolvedBy") resolvedBy?: string
  ) {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    const filters = {
      reporterUsername,
      reporterId,
      targetUsername,
      targetId,
      reason,
      dateFrom,
      dateTo,
      ipAddress,
      resolvedBy,
    };

    return this.reportService.exportReportsHtml(status, type, filters);
  }

  @Get(":id/export/json")
  @ApiOperation({ summary: "Export a single report as JSON (Admin only)" })
  @ApiResponse({ status: 200, description: "Report exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  async exportSingleReportJson(
    @Param("id") reportId: string,
    @Req() req: Request
  ) {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    return this.reportService.exportSingleReportJson(reportId);
  }

  @Get(":id/export/html")
  @ApiOperation({ summary: "Export a single report as HTML (Admin only)" })
  @ApiResponse({ status: 200, description: "Report exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  async exportSingleReportHtml(
    @Param("id") reportId: string,
    @Req() req: Request
  ) {
    const userId = req.headers["x-user-id"] as string;

    // Check if user has admin permissions
    await this.validateAdminAccess(userId);

    return this.reportService.exportSingleReportHtml(reportId);
  }

  private async validateAdminAccess(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      !user ||
      (user.role !== UserRole.OWNER &&
        user.role !== UserRole.HIGHER_STAFF &&
        user.role !== UserRole.STAFF)
    ) {
      throw new ForbiddenException(
        "Insufficient permissions to access reports"
      );
    }
  }
}
