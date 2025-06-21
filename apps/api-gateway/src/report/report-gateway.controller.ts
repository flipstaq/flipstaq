import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { Request } from "express";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post()
  @ApiOperation({ summary: "Submit a report" })
  @ApiResponse({ status: 201, description: "Report submitted successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid request or already reported",
  })
  @ApiResponse({ status: 409, description: "Already reported this item" })
  @ApiBody({
    description: "Report submission data",
    schema: {
      type: "object",
      required: ["type", "reason"],
      properties: {
        type: {
          type: "string",
          enum: ["USER", "PRODUCT", "MESSAGE"],
          description: "Type of report",
        },
        targetUserId: {
          type: "string",
          description: "Target user ID (for USER reports)",
        },
        targetProductId: {
          type: "string",
          description: "Target product ID (for PRODUCT reports)",
        },
        targetMessageId: {
          type: "string",
          description: "Target message ID (for MESSAGE reports)",
        },
        reason: {
          type: "string",
          description: "Reason for the report",
        },
        comment: {
          type: "string",
          maxLength: 500,
          description: "Additional comment (optional)",
        },
      },
    },
  })
  async createReport(
    @Body() createReportDto: any,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

    const response = await this.proxyService.forwardReportRequest(
      "",
      "POST",
      createReportDto,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-user-ip": ipAddress,
      }
    );
    return response.data;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Get all reports (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports retrieved successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiQuery({
    name: "page",
    description: "Page number for pagination",
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    description: "Number of items per page",
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: "status",
    description: "Filter by report status",
    required: false,
    enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
  })
  @ApiQuery({
    name: "type",
    description: "Filter by report type",
    required: false,
    enum: ["USER", "PRODUCT", "MESSAGE"],
  })
  @ApiQuery({
    name: "reporterUsername",
    description: "Filter by reporter username",
    required: false,
  })
  @ApiQuery({
    name: "reporterId",
    description: "Filter by reporter ID",
    required: false,
  })
  @ApiQuery({
    name: "targetUsername",
    description: "Filter by target username",
    required: false,
  })
  @ApiQuery({
    name: "targetId",
    description: "Filter by target ID",
    required: false,
  })
  @ApiQuery({
    name: "reason",
    description: "Filter by reason",
    required: false,
  })
  @ApiQuery({
    name: "dateFrom",
    description: "Filter by start date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "dateTo",
    description: "Filter by end date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "ipAddress",
    description: "Filter by IP address",
    required: false,
  })
  @ApiQuery({
    name: "resolvedBy",
    description: "Filter by resolver username",
    required: false,
  })
  async getReports(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
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
    const userId = req.user?.userId || req.user?.sub;

    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);
    if (status) queryParams.append("status", status);
    if (type) queryParams.append("type", type);
    if (reporterUsername)
      queryParams.append("reporterUsername", reporterUsername);
    if (reporterId) queryParams.append("reporterId", reporterId);
    if (targetUsername) queryParams.append("targetUsername", targetUsername);
    if (targetId) queryParams.append("targetId", targetId);
    if (reason) queryParams.append("reason", reason);
    if (dateFrom) queryParams.append("dateFrom", dateFrom);
    if (dateTo) queryParams.append("dateTo", dateTo);
    if (ipAddress) queryParams.append("ipAddress", ipAddress);
    if (resolvedBy) queryParams.append("resolvedBy", resolvedBy);

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : "";

    const response = await this.proxyService.forwardReportRequest(
      endpoint,
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Patch(":id/resolve")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Resolve a report (Admin only)" })
  @ApiResponse({ status: 200, description: "Report resolved successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  @ApiParam({
    name: "id",
    description: "Report ID to resolve",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  async resolveReport(
    @Param("id") reportId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const response = await this.proxyService.forwardReportRequest(
      `${reportId}/resolve`,
      "PATCH",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Patch(":id/dismiss")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Dismiss a report (Admin only)" })
  @ApiResponse({ status: 200, description: "Report dismissed successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  @ApiParam({
    name: "id",
    description: "Report ID to dismiss",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  async dismissReport(
    @Param("id") reportId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const response = await this.proxyService.forwardReportRequest(
      `${reportId}/dismiss`,
      "PATCH",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Patch(":id/under-review")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Set a report as under review (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Report set to under review successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  @ApiParam({
    name: "id",
    description: "Report ID to set under review",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  async setUnderReview(
    @Param("id") reportId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const response = await this.proxyService.forwardReportRequest(
      `${reportId}/under-review`,
      "PATCH",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Get("export/json")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Export reports as JSON (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiQuery({
    name: "status",
    description: "Filter by report status",
    required: false,
    enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
  })
  @ApiQuery({
    name: "type",
    description: "Filter by report type",
    required: false,
    enum: ["USER", "PRODUCT", "MESSAGE"],
  })
  @ApiQuery({
    name: "reporterUsername",
    description: "Filter by reporter username",
    required: false,
  })
  @ApiQuery({
    name: "reporterId",
    description: "Filter by reporter ID",
    required: false,
  })
  @ApiQuery({
    name: "targetUsername",
    description: "Filter by target username",
    required: false,
  })
  @ApiQuery({
    name: "targetId",
    description: "Filter by target ID",
    required: false,
  })
  @ApiQuery({
    name: "reason",
    description: "Filter by reason",
    required: false,
  })
  @ApiQuery({
    name: "dateFrom",
    description: "Filter by start date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "dateTo",
    description: "Filter by end date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "ipAddress",
    description: "Filter by IP address",
    required: false,
  })
  @ApiQuery({
    name: "resolvedBy",
    description: "Filter by resolver username",
    required: false,
  })
  async exportReportsJson(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
    @Query("type") type?: string,
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
    const userId = req.user?.userId || req.user?.sub;

    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (type) queryParams.append("type", type);
    if (reporterUsername)
      queryParams.append("reporterUsername", reporterUsername);
    if (reporterId) queryParams.append("reporterId", reporterId);
    if (targetUsername) queryParams.append("targetUsername", targetUsername);
    if (targetId) queryParams.append("targetId", targetId);
    if (reason) queryParams.append("reason", reason);
    if (dateFrom) queryParams.append("dateFrom", dateFrom);
    if (dateTo) queryParams.append("dateTo", dateTo);
    if (ipAddress) queryParams.append("ipAddress", ipAddress);
    if (resolvedBy) queryParams.append("resolvedBy", resolvedBy);

    const endpoint = `export/json${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await this.proxyService.forwardReportRequest(
      endpoint,
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Get("export/html")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Export reports as HTML (Admin only)" })
  @ApiResponse({ status: 200, description: "Reports exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiQuery({
    name: "status",
    description: "Filter by report status",
    required: false,
    enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
  })
  @ApiQuery({
    name: "type",
    description: "Filter by report type",
    required: false,
    enum: ["USER", "PRODUCT", "MESSAGE"],
  })
  @ApiQuery({
    name: "reporterUsername",
    description: "Filter by reporter username",
    required: false,
  })
  @ApiQuery({
    name: "reporterId",
    description: "Filter by reporter ID",
    required: false,
  })
  @ApiQuery({
    name: "targetUsername",
    description: "Filter by target username",
    required: false,
  })
  @ApiQuery({
    name: "targetId",
    description: "Filter by target ID",
    required: false,
  })
  @ApiQuery({
    name: "reason",
    description: "Filter by reason",
    required: false,
  })
  @ApiQuery({
    name: "dateFrom",
    description: "Filter by start date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "dateTo",
    description: "Filter by end date (YYYY-MM-DD)",
    required: false,
  })
  @ApiQuery({
    name: "ipAddress",
    description: "Filter by IP address",
    required: false,
  })
  @ApiQuery({
    name: "resolvedBy",
    description: "Filter by resolver username",
    required: false,
  })
  async exportReportsHtml(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
    @Query("type") type?: string,
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
    const userId = req.user?.userId || req.user?.sub;

    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (type) queryParams.append("type", type);
    if (reporterUsername)
      queryParams.append("reporterUsername", reporterUsername);
    if (reporterId) queryParams.append("reporterId", reporterId);
    if (targetUsername) queryParams.append("targetUsername", targetUsername);
    if (targetId) queryParams.append("targetId", targetId);
    if (reason) queryParams.append("reason", reason);
    if (dateFrom) queryParams.append("dateFrom", dateFrom);
    if (dateTo) queryParams.append("dateTo", dateTo);
    if (ipAddress) queryParams.append("ipAddress", ipAddress);
    if (resolvedBy) queryParams.append("resolvedBy", resolvedBy);

    const endpoint = `export/html${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await this.proxyService.forwardReportRequest(
      endpoint,
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Get(":id/export/json")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Export a single report as JSON (Admin only)" })
  @ApiResponse({ status: 200, description: "Report exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  @ApiParam({
    name: "id",
    description: "Report ID to export",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  async exportSingleReportJson(
    @Param("id") reportId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const response = await this.proxyService.forwardReportRequest(
      `${reportId}/export/json`,
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }

  @Get(":id/export/html")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Export a single report as HTML (Admin only)" })
  @ApiResponse({ status: 200, description: "Report exported successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Report not found" })
  @ApiParam({
    name: "id",
    description: "Report ID to export",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  async exportSingleReportHtml(
    @Param("id") reportId: string,
    @Req() req: AuthenticatedRequest
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const response = await this.proxyService.forwardReportRequest(
      `${reportId}/export/html`,
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
      }
    );
    return response.data;
  }
}
